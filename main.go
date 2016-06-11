package main

import (
	"flag"
	"io/ioutil"
	"log"
	"net/http"
	"strconv"
	"strings"

	"github.com/kelseyhightower/envconfig"
	_ "github.com/vibhavp/tf2-stats/controllers"
	"github.com/vibhavp/tf2-stats/database"
	"github.com/vibhavp/tf2-stats/models"
)

var file = flag.String("logsfile", "", "logsfile to load initial logs from")
var config = struct {
	Address string `envconfig:"ADDRESS" default:":8080"`
}{}

func main() {
	flag.Parse()
	envconfig.MustProcess("", &config)
	log.SetFlags(log.Lshortfile)
	database.Open()
	models.Migrate()
	if *file != "" {
		log.Printf("Reading logs from %s...", *file)
		bytes, err := ioutil.ReadFile(*file)
		if err != nil {
			log.Fatal(err)
		}

		logs := strings.Split(string(bytes), "\n")
		for _, idStr := range logs {
			id, err := strconv.Atoi(idStr)
			if err != nil {
				log.Fatal(err)
			}
			log.Println(id)
			err = models.AddStats(id, true)
			if err != nil {
				log.Fatalf("Error in adding %d: %v", id, err)
			}
		}
		log.Println("done!")
	}

	log.Println("serving on :8080")
	log.Fatal(http.ListenAndServe(config.Address, nil))
}
