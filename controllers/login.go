package controllers

import (
	"log"
	"net/http"
	"time"

	"github.com/kelseyhightower/envconfig"
)

var config = struct {
	Username string `envconfig:"USERNAME" required:"true"`
	Password string `envconfig:"PASSWORD" required:"true"`
}{}

func init() {
	envconfig.MustProcess("", &config)
	log.Printf("username: %s, password %s", config.Username, config.Password)
}

func login(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	pass := query.Get("password")
	username := query.Get("username")

	if username != config.Username || pass != config.Password {
		http.Error(w, "Invalid username/password", http.StatusUnauthorized)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:    "login",
		Path:    "/",
		Value:   username + pass,
		Domain:  "",
		Expires: time.Now().Add(30 * 24 * time.Hour),
	})

	http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
}
