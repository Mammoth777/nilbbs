package test

import (
	"log"
	"testing"

	"github.com/Mammoth777/nilbbs/nickname"
)

func TestNickname(t *testing.T) {
	name := nickname.GetRandomNickname()
	log.Println(name)

}