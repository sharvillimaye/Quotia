package api

import (
	"database/sql"
	"log"
	"net/http"

	"github.com/sharvillimaye/quotio/server/service/health"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"github.com/sharvillimaye/quotio/server/service/user"
)

type APIServer struct {
	addr string
	db   *sql.DB
}

func NewAPIServer(addr string, db *sql.DB) *APIServer {
	return &APIServer{
		addr: addr,
		db:   db,
	}
}

func (s *APIServer) Run() error {
	router := mux.NewRouter()
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:5173"}, // Update with your client origin
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders: []string{"Authorization", "Content-Type"},
	})

	subrouter := router.PathPrefix("/api/v1/").Subrouter()

	healthHandler := health.NewHandler()
	healthHandler.RegisterRoutes(subrouter)

	userStore := user.NewStore(s.db)
	userHandler := user.NewHandler(userStore)
	userHandler.RegisterRoutes(subrouter)

	log.Println("Listening on", s.addr)

	handler := c.Handler(router)

	return http.ListenAndServe(s.addr, handler)
}
