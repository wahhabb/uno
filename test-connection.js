// Simple test script to verify Supabase connection
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET');
console.log('');

if (!supabaseUrl || !supabaseKey) {
	console.error('❌ ERROR: Environment variables not set!');
	console.error('Make sure PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are in .env file');
	process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
	try {
		// Test 1: Check if we can query the players table
		console.log('Test 1: Checking players table...');
		const { data: players, error: playersError } = await supabase
			.from('players')
			.select('*')
			.limit(1);

		if (playersError) {
			console.error('❌ Players table error:', playersError.message);
			return false;
		}
		console.log('✅ Players table accessible');

		// Test 2: Check games table
		console.log('Test 2: Checking games table...');
		const { data: games, error: gamesError } = await supabase
			.from('games')
			.select('*')
			.limit(1);

		if (gamesError) {
			console.error('❌ Games table error:', gamesError.message);
			return false;
		}
		console.log('✅ Games table accessible');

		// Test 3: Check game_players table
		console.log('Test 3: Checking game_players table...');
		const { data: gamePlayers, error: gamePlayersError } = await supabase
			.from('game_players')
			.select('*')
			.limit(1);

		if (gamePlayersError) {
			console.error('❌ Game_players table error:', gamePlayersError.message);
			return false;
		}
		console.log('✅ Game_players table accessible');

		// Test 4: Check game_invitations table
		console.log('Test 4: Checking game_invitations table...');
		const { data: invitations, error: invitationsError } = await supabase
			.from('game_invitations')
			.select('*')
			.limit(1);

		if (invitationsError) {
			console.error('❌ Game_invitations table error:', invitationsError.message);
			return false;
		}
		console.log('✅ Game_invitations table accessible');

		// Test 5: Check game_state table
		console.log('Test 5: Checking game_state table...');
		const { data: gameState, error: stateError } = await supabase
			.from('game_state')
			.select('*')
			.limit(1);

		if (stateError) {
			console.error('❌ Game_state table error:', stateError.message);
			return false;
		}
		console.log('✅ Game_state table accessible');

		// Test 6: Check game_actions table
		console.log('Test 6: Checking game_actions table...');
		const { data: actions, error: actionsError } = await supabase
			.from('game_actions')
			.select('*')
			.limit(1);

		if (actionsError) {
			console.error('❌ Game_actions table error:', actionsError.message);
			return false;
		}
		console.log('✅ Game_actions table accessible');

		// Test 7: Try creating a test player
		console.log('Test 7: Testing insert operation...');
		const testEmail = `test-${Date.now()}@example.com`;
		const { data: newPlayer, error: insertError } = await supabase
			.from('players')
			.insert({
				email: testEmail,
				display_name: 'Test Player'
			})
			.select()
			.single();

		if (insertError) {
			console.error('❌ Insert error:', insertError.message);
			return false;
		}
		console.log('✅ Insert operation successful');

		// Clean up test player
		await supabase.from('players').delete().eq('email', testEmail);
		console.log('✅ Test data cleaned up');

		return true;
	} catch (err) {
		console.error('❌ Unexpected error:', err);
		return false;
	}
}

testConnection().then((success) => {
	console.log('\n' + '='.repeat(50));
	if (success) {
		console.log('🎉 All tests passed! Supabase is ready to use.');
		console.log('✅ Connection working');
		console.log('✅ All tables accessible');
		console.log('✅ Read/Write operations working');
	} else {
		console.log('❌ Some tests failed. Check the errors above.');
	}
	console.log('='.repeat(50));
	process.exit(success ? 0 : 1);
});
