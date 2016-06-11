package models

import (
	"log"

	"github.com/TF2Stadium/logstf"
	db "github.com/vibhavp/tf2-stats/database"
)

type Match struct {
	ID     uint `gorm:"primary_key"`
	LogsID int  `sql:"not null;unique"`
}

type Player struct {
	ID      uint   `gorm:"primary_key" json:"id"`
	Name    string `json:"name"`
	SteamID string `sql:"not null;unique" json:"-"`
}

type Stat struct {
	ID     uint `json:"-"`
	LogsID uint `json:"-"`

	Class     string  `json:"class"`
	DPM       float64 `json:"dpm"`
	Kills     int     `json:"kills"`
	Deaths    int     `json:"deaths"`
	KD        float64 `json:"kd"`
	TotalTime int     `json:"-"`
	Drops     int     `json:"drops"`
	Airshots  int     `json:"airshots,omitempty"`

	PlayerID uint   `json:"-"`
	Player   Player `gorm:"ForeignKey:PlayerID" json:"player"`
}

type AvgStats struct {
	ID uint `json:"-"`

	Class    string  `json:"class"`
	DPM      float64 `json:"dpm"`
	Kills    int     `json:"kills"`
	Deaths   int     `json:"deaths"`
	KD       float64 `json:"kd"`
	Drops    float64 `json:"drops"`
	Airshots float64 `json:"airshots,omitempty"`

	PlayerID uint   `json:"-"`
	Player   Player `gorm:"ForeignKey:PlayerID" json:"player"`
}

func Migrate() {
	db.DB.AutoMigrate(&Match{})
	db.DB.AutoMigrate(&Player{})
	db.DB.AutoMigrate(&Stat{})
	db.DB.AutoMigrate(&AvgStats{})

	db.DB.Model(&AvgStats{}).
		AddUniqueIndex("idx_player_id_class", "player_id", "class")
}

func getPlayerID(steamID string) uint {
	var id uint
	db.DB.Model(&Player{}).Select("id").Where("steam_id = ?", steamID).Row().Scan(&id)
	return id
}

func Exists(id int) bool {
	var count uint
	db.DB.DB().QueryRow("SELECT COUNT(*) FROM matches WHERE logs_id = ?", id).Scan(&count)
	return count != 0
}

func addPlayers(names map[string]string) {
	for steamID, name := range names {
		var count uint
		db.DB.Model(&Player{}).Where("steam_id = ?", steamID).Count(&count)
		if count == 0 {
			db.DB.Save(&Player{
				Name:    name,
				SteamID: steamID,
			})
		}
	}
}

func AddStats(id int, updateAvg bool) error {
	logs, err := logstf.GetLogs(id)
	if err != nil {
		return err
	}

	db.DB.Save(&Match{
		LogsID: id,
	})
	addPlayers(logs.Names)
	var ids []uint

	for steamID, stats := range logs.Players {
		id := getPlayerID(steamID)
		ids = append(ids, id)

		for _, cstats := range stats.ClassStats {
			if cstats.TotalTime == 0 {
				continue
			}
			if cstats.Type == "undefined" {
				continue
			}

			var kd float64
			if cstats.Deaths == 0 {
				kd = float64(cstats.Kills)
			} else {
				kd = float64(cstats.Kills) / float64(cstats.Deaths)
			}

			min := float64(cstats.TotalTime) / 60.0 // minutes played
			stat := &Stat{
				Class:     cstats.Type,
				LogsID:    id,
				DPM:       float64(cstats.Damage) / min,
				Kills:     cstats.Kills,
				Deaths:    cstats.Deaths,
				KD:        kd,
				Drops:     stats.Drops,
				TotalTime: cstats.TotalTime,
				PlayerID:  id,
			}
			if cstats.Type == "soldier" || cstats.Type == "demoman" {
				stat.Airshots = stats.Airshots
			}
			db.DB.Save(stat)
		}
	}

	if updateAvg {
		UpdateAvgStats(ids)
	}
	return nil
}

var classes = []string{"scout", "soldier", "pyro", "demoman", "heavyweapons",
	"medic", "spy", "sniper", "engineer"}

func UpdateAvgStats(playerIDs []uint) {
	for _, id := range playerIDs {
		for _, class := range classes {
			var final AvgStats
			final.PlayerID = id
			var stats []Stat

			err := db.DB.Model(&Stat{}).Where("player_id = ? AND class = ?", id, class).Find(&stats).Error
			if len(stats) == 0 {
				continue
			}
			if err != nil {
				log.Println(err)
			}

			for _, stat := range stats {
				final.DPM += stat.DPM / float64(len(stats))
				final.Class = stat.Class
				final.Kills += stat.Kills / len(stats)
				final.Deaths += stat.Deaths / len(stats)
				final.KD += stat.KD / float64(len(stats))
				final.Airshots += float64(stat.Airshots) / float64(len(stats))
				final.Drops += float64(stat.Drops) / float64(len(stats))
			}

			db.DB.Where("player_id = ? AND class = ?", id, class).Delete(&AvgStats{})
			db.DB.Save(&final)
		}

	}
}

func GetClassStats(class string) []AvgStats {
	var stats []AvgStats
	db.DB.Preload("Player").Where("class = ?", class).Find(&stats)
	return stats
}

func GetPlayerStats(playerID uint) []Stat {
	var stats []Stat
	db.DB.Preload("Player").Where("player_id = ?", playerID).Order("logs_id").Find(&stats)
	for i := 1; i < len(stats); i++ {
		if stats[i].LogsID == stats[i-1].LogsID {
			stats[i-1].Deaths += stats[i].Deaths
			stats = append(stats[:i], stats[i+1:]...)
		}
	}

	return stats
}

func GetAllPlayers() []Player {
	var players []Player
	db.DB.Find(&players)
	return players
}
