package logstf

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"
)

type PlayerStats struct {
	Team          string         `json:"team"`
	Classes       []string       `json:"classes"`
	Kills         int            `json:"kills"`
	Deaths        int            `json:"deaths"`
	Assists       int            `json:"assists"`
	Kapd          string         `json:"kapd"`
	Kpd           string         `json:"kpd"`
	Damage        int            `json:"dmg"`
	Lks           int            `json:"lks"`
	Airshots      int            `json:"as"`
	Dapd          int            `json:"dapd"`
	Dapm          int            `json:"dapm"` // damage per minute
	Ubers         int            `json:"ubers"`
	UberTypes     map[string]int `json:"ubertypes"`
	Drops         int            `json:"drops"`
	Backstabs     int            `json:"backstabs"`
	Headshots     int            `json:"headshots"`
	Heal          int            `json:"heal"`
	HealsReceived int            `json:"hr"`
	Cpc           int            `json:"cpc"`
	Ic            int            `json:"ic"`
	Medkits       int            `json:"medkits"`
	ClassStats    []ClassStats   `json:"class_stats"`
	MedicStats    MedicStats     `json:"medicstats"`
}

type MedicStats struct {
	AdvantagesLost           json.Number `json:"advantages_lost"`
	BiggestAdvantageLost     json.Number `json:"biggest_advantage_lost"`
	DeathsWithin20SAfterUber json.Number `json:"deaths_within_20s_after_uber"`
	DeathsWith9599Uber       json.Number `json:"deaths_with_95_99_uber"`
	AvgTimeBeforeHealing     json.Number `json:"avg_time_before_healing"`
	AvgTimeToBuild           json.Number `json:"avg_time_to_build"`
	AvgTimeBeforeUsing       json.Number `json:"avg_time_before_using"`
	AvgUberLength            json.Number `json:"avg_uber_length"`
}

type ClassStats struct {
	Kills     int    `json:"kills"`
	Assists   int    `json:"assists"`
	Deaths    int    `json:"deaths"`
	Damage    int    `json:"dmg"`
	TotalTime int    `json:"total_time"` //time played in seconds
	Type      string `json:"type"`
}

type TeamStats struct {
	Kills  int `json:"kills"`
	Damage int `json:"damage"`
	Ubers  int `json:"ubers"`
	Score  int `json:"score"`
}

type Event struct {
	Type    string `json:"type"`
	Time    int    `json:"time"`
	Team    string `json:"team"`
	Point   int    `json:"point,omitempty"`
	SteamID string `json:"steamid,omitempty"`
	Killer  string `json:"killer,omitempty"`
}

type ChatMessage struct {
	Name    string `json:"name"`
	Time    int    `json:"time"`
	SteamID string `json:"steamid"`
	Message string `json:"msg"`
}

type Round struct {
	Winner string    `json:"winner"`
	Red    TeamStats `json:"Red"`
	Blue   TeamStats `json:"Blue"`

	Events  []Event `json:"events"`
	Players map[string]struct {
		Kills  int `json:"kills"`
		Damage int `json:"dmg"`
	} `json:"players"`
	Length int `json:"length"`
}

type MatchInfo struct {
	Red struct {
		Score int `json:"score"`
	} `json:"Red"`
	Blue struct {
		Score int `json:"score"`
	} `json:"Blue"`

	Rounds []Round `json:"rounds"`

	TotalLength  int         `json:"total_length"`
	Supplemental bool        `json:"supplemental"`
	HasIntel     bool        `json:"hasIntel"`
	HasCP        bool        `json:"hasCP"`
	HasBS        bool        `json:"hasBS"`
	HasKS        bool        `json:"hasKS"`
	HasHS        bool        `json:"hasHS"`
	HasHP        bool        `json:"hasHP"`
	Map          interface{} `json:"map"`
}

type Logs struct {
	Info MatchInfo `json:"info"`

	Names   map[string]string      `json:"names"`
	Players map[string]PlayerStats `json:"players"`

	ClassKills  map[string]map[string]int `json:"classkills"`
	ClassDeaths map[string]map[string]int `json:"classdeaths"`
	HealSpread  map[string]map[string]int `json:"healspread"`

	Chat []ChatMessage `json:"chat"`
}

var client = &http.Client{
	Timeout: 10 * time.Second,
}

func GetLogs(logsID int) (*Logs, error) {
	logs := &Logs{}

	resp, err := client.Get("http://logs.tf/json/" + strconv.Itoa(logsID))
	if err != nil {
		return nil, err
	}

	err = json.NewDecoder(resp.Body).Decode(logs)
	return logs, err
}
