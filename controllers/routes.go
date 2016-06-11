package controllers

import (
	"html/template"
	"net/http"

	"github.com/vibhavp/tf2-stats/models"
)

var classes = map[string]string{
	"scout":        "Scout",
	"soldier":      "Soldier",
	"demoman":      "Demoman",
	"sniper":       "Sniper",
	"medic":        "Medic",
	"spy":          "Spy",
	"heavyweapons": "Heavy",
	"engineer":     "Engineer",
	"pyro":         "Pyro",
}

var mainTemplate = template.Must(template.ParseFiles("views/index.html"))

func init() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		mainTemplate.Execute(w, map[string]interface{}{
			"loggedIn": isLoggedIn(r),
			"classes":  classes,
			"players":  models.GetAllPlayers(),
		})
	})
	http.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "views/login.html")
	})
	http.Handle("/js/", http.StripPrefix("/js/", http.FileServer(http.Dir("js"))))
	http.HandleFunc("/add", add)
	http.HandleFunc("/dologin", login)
	http.HandleFunc("/getstats", getStats)
	http.HandleFunc("/draw", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "views/draw.html")
	})
}

func isLoggedIn(r *http.Request) bool {
	if cookie, err := r.Cookie("login"); err == nil {
		return cookie.Value == config.Username+config.Password
	}
	return false
}
