package controllers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"

	"github.com/vibhavp/tf2-stats/models"
)

var reValidURL = regexp.MustCompile(`logs.tf/(\d+)`)

func add(w http.ResponseWriter, r *http.Request) {
	if !isLoggedIn(r) {
		http.Error(w, "You are not logged in", http.StatusUnauthorized)
		return
	}
	url := r.URL.Query().Get("url")
	if url == "" {
		fmt.Fprintln(w, "No URL given.")
		return
	}
	if !reValidURL.MatchString(url) {
		fmt.Fprintln(w, "Invalid URL")
		return
	}

	m := reValidURL.FindStringSubmatch(url)
	id, err := strconv.Atoi(m[1])
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if models.Exists(id) {
		fmt.Fprintln(w, "This match has already been added")
		return
	}

	err = models.AddStats(id, true)
	if err != nil {
		fmt.Fprintln(w, err)
		return
	}

	fmt.Fprintln(w, "Added!")
}

func getStats(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	class := query.Get("class")
	if class == "" {
		if query.Get("playerid") != "" {
			getPlayerStats(w, r)
		} else if query.Get("allclass") != "" {
			getAllClassStats(w, r)
		} else {
			json.NewEncoder(w).Encode(map[string]string{
				"error": "no params",
			})
		}
		return
	}
	e := json.NewEncoder(w)
	e.Encode(map[string]interface{}{
		"type": "class",
		"data": models.GetClassStats(class),
	})
}

func getPlayerStats(w http.ResponseWriter, r *http.Request) {
	playerID, err := strconv.ParseUint(r.URL.Query().Get("playerid"), 10, 64)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	e := json.NewEncoder(w)
	e.Encode(map[string]interface{}{
		"type": "player",
		"data": models.GetPlayerStats(uint(playerID)),
	})
}

func getAllClassStats(w http.ResponseWriter, r *http.Request) {
	e := json.NewEncoder(w)
	e.Encode(map[string]interface{}{
		"type": "allclass",
		"data": models.GetAllClassStats(),
	})
}
