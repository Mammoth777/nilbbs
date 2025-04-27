package nickname

import (
	"bufio"
	"fmt"
	"log"
	"math/rand"
	"os"
	"strings"
)

var adjectives []string
var nouns []string

// loadWordsFromFile reads lines from a file and returns them as a slice of strings.
func loadWordsFromFile(filePath string) ([]string, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to open file %s: %w", filePath, err)
	}
	defer file.Close()

	var words []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		// Skip empty lines or lines starting with '#' (comments)
		if line != "" && !strings.HasPrefix(line, "#") && !strings.HasPrefix(line, "\\") {
			words = append(words, line)
		}
	}

	if err := scanner.Err(); err != nil {
		return nil, fmt.Errorf("error reading file %s: %w", filePath, err)
	}

	if len(words) == 0 {
		return nil, fmt.Errorf("no words loaded from file %s", filePath)
	}

	return words, nil
}

func init() {
	var err error
	// Load adjectives from file
	adjectives, err = loadWordsFromFile("assets/dataset/adjectives.txt")
	if err != nil {
		log.Printf("Error loading adjectives from adjectives.txt: %v. Using default list.", err)
	}

	// Load nouns from file
	nouns, err = loadWordsFromFile("assets/dataset/nouns.txt")
	if err != nil {
		log.Printf("Error loading nouns from nouns.txt: %v. Using default list.", err)
	}

	// Ensure lists are not empty after attempting to load or falling back
	if len(adjectives) == 0 {
		log.Fatal("Adjectives list is empty after init.")
	}
	if len(nouns) == 0 {
		log.Fatal("Nouns list is empty after init.")
	}

}

func GetRandomNickname() string {
	if len(adjectives) == 0 || len(nouns) == 0 {
		// This should ideally not happen due to checks in init, but as a safeguard:
		log.Println("Warning: Adjectives or nouns list is empty, returning default nickname.")
		return "默认昵称"
	}
	adjIndex := rand.Intn(len(adjectives))
	nounIndex := rand.Intn(len(nouns))
	return fmt.Sprintf("%s%s", adjectives[adjIndex], nouns[nounIndex])
}