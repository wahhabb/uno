 Authentication & User Management
                                                                                      
  1. User accounts: Do players need to create accounts (with Supabase Auth), or can
  they join as guests with just a display name?
  * Users can join just using their email and choose a display name.
  * A user starting a game will list emails of other players being invited to the game.
  * Deferred feature: Users can ask the list of emails to be saved with a group name.
  2. If using accounts, what authentication methods? (Email/password, Google, etc.)
* n/a
  Game Lobby & Room Management

  3. How do players join games? (e.g., create a room with a shareable code, random
  matchmaking, invite links?)
  * A player enters their email. 
  * If someone has invited them, they are taken to that game.
  * If no one has invited them, they are asked to give emails of players to be invited.

  4. Player count: What's the min/max number of players per game? (Uno typically
  supports 2-10 players)
  * 7 players max
  5. Should there be both public and private game rooms?
  * For now, only private game rooms

  Uno Game Rules

  6. Which rule variant? Standard Uno rules, or specific house rules? For example:
    - Can players stack +2 or +4 cards?
    - Jump-in allowed (play out of turn if you have exact match)?
    - Must say "UNO" when down to one card?
    - Challenge rules for Wild Draw 4 cards?
* Standard Rules.
* There is a button to press to say "UNO" 

  Gameplay Mechanics

  7. Turn timers: Should there be time limits for taking turns, or more
  casual/flexible timing?
  * For now, no time limits
  8. Reconnection: Should games persist if a player disconnects temporarily?
  * For now, games persist and the player can reconnect. 
  * There should be a game timeout if one hour with no plays.
  9. Game history: Do you want to track player statistics, game history, leaderboards?
* This is a deferred feature.
  Features & UX

  10. In-game communication: Do you want text chat, emojis, or quick reactions during
  games?
  * This should be a late addition. 
  11. Mobile support: Should it be fully responsive for mobile/tablet play?
  * It needs to be playable on a modern smartphone or a tablet

  Assets

  12. Card designs: Do you have SVG card designs ready, or should I plan to
  create/source them?
  * I have placed one card in this folder. Cards can be downloaded from https://creazilla.com/media/clipart/uno
 
  13. Sound effects: Do you have sound files (card flip, shuffle, etc.), or should I
  plan to source royalty-free sounds?
* I don't have sounds. Please find them.
  Deployment

  14. Hosting preference: Any specific platform? (Vercel and Netlify work great with
  SvelteKit)
* I will use Vercel.
