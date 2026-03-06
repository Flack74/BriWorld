package game

type TeamBattleState struct {
	RedTeam     []string                   `json:"red_team"`
	BlueTeam    []string                   `json:"blue_team"`
	RedScore    int                        `json:"red_score"`
	BlueScore   int                        `json:"blue_score"`
	Votes       map[string]*TeamBattleVote `json:"votes"`
	VotingEnded bool                       `json:"voting_ended"`
	RedAnswer   string                     `json:"red_answer"`
	BlueAnswer  string                     `json:"blue_answer"`
}

type TeamBattleVote struct {
	Player string `json:"player"`
	Answer string `json:"answer"`
	Team   string `json:"team"`
	Time   int64  `json:"time"`
}

func NewTeamBattleState(players []string) *TeamBattleState {
	state := &TeamBattleState{
		RedTeam:  []string{},
		BlueTeam: []string{},
		Votes:    make(map[string]*TeamBattleVote),
	}
	for i, player := range players {
		if i%2 == 0 {
			state.RedTeam = append(state.RedTeam, player)
		} else {
			state.BlueTeam = append(state.BlueTeam, player)
		}
	}
	return state
}

func (s *TeamBattleState) GetPlayerTeam(username string) string {
	for _, p := range s.RedTeam {
		if p == username {
			return "RED"
		}
	}
	return "BLUE"
}

func (s *TeamBattleState) GetMajorityVote(team string) string {
	votes := make(map[string]int)
	var firstVote string
	var firstTime int64 = 9999999999

	for _, vote := range s.Votes {
		if vote.Team == team {
			votes[vote.Answer]++
			if vote.Time < firstTime {
				firstTime = vote.Time
				firstVote = vote.Answer
			}
		}
	}

	if len(votes) == 0 {
		return ""
	}

	maxVotes := 0
	var majority string
	for answer, count := range votes {
		if count > maxVotes {
			maxVotes = count
			majority = answer
		} else if count == maxVotes && answer == firstVote {
			majority = firstVote
		}
	}
	return majority
}
