(function() {
    'use strict';

    // Configuration
    const TARGET_SCORE = 1000000; // Desired raw score
    const CHECK_INTERVAL_MS = 100; // How often to check/enforce the score
    const DEBUG = true; // Enable debugging output

    // Utility function to log debug messages
    function debugLog(...args) {
        if (DEBUG) {
            console.log('[Score Hack]', ...args);
        }
    }

    // Find the game canvas to access gameState
    function findGameState() {
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            debugLog('Canvas not found.');
            return null;
        }
        const fiberKey = Object.keys(canvas).find(key => key.startsWith('__reactFiber$'));
        if (!fiberKey) {
            debugLog('Canvas is not managed by React.');
            return null;
        }
        const fiberNode = canvas[fiberKey];
        let current = fiberNode;
        while (current) {
            if (current.memoizedProps && current.memoizedProps.gameState) {
                debugLog('Found gameState in React fiber:', current.memoizedProps.gameState);
                return current.memoizedProps.gameState;
            }
            current = current.return;
        }
        debugLog('Could not find gameState in React fiber.');
        return null;
    }

    // Find the React state for playerScore
    function findReactPlayerScore() {
        const scoreElement = document.querySelector('.text-4xl.font-extrabold.text-white.drop-shadow-lg') || // In-game score
                          document.querySelector('.mb-2.text-3xl.font-bold.text-white') || // Game over score
                          document.querySelector('.text-center.text-lg.font-medium.text-white span.font-bold'); // Confirmation score
        if (!scoreElement) {
            debugLog('Score element not found.');
            return null;
        }
        const fiberKey = Object.keys(scoreElement).find(key => key.startsWith('__reactFiber$'));
        if (!fiberKey) {
            debugLog('Score element is not managed by React.');
            return null;
        }
        const fiberNode = scoreElement[fiberKey];
        let current = fiberNode;
        while (current) {
            if (current.memoizedState && typeof current.memoizedState.memoizedState === 'number') {
                debugLog('Found potential playerScore state:', current.memoizedState.memoizedState);
                return { fiberNode: current, setScore: current.memoizedState.memoizedState[1] };
            }
            current = current.return;
        }
        debugLog('Could not find playerScore state in React fiber.');
        return null;
    }

    // Set the score in gameState and React state
    function setRealScore() {
        debugLog('Attempting to set real score to', TARGET_SCORE);

        // Step 1: Set gameState.player.score
        const gameState = findGameState();
        if (gameState && gameState.player) {
            gameState.player.score = TARGET_SCORE;
            debugLog('Set gameState.player.score to', TARGET_SCORE);
        } else {
            debugLog('Failed to find or set gameState.player.score');
        }

        // Step 2: Set React playerScore state
        const reactScore = findReactPlayerScore();
        if (reactScore && reactScore.setScore) {
            reactScore.setScore(TARGET_SCORE);
            debugLog('Set React playerScore state to', TARGET_SCORE);
        } else {
            debugLog('Failed to find or set React playerScore state');
        }

        // Step 3: Update DOM displays (for visual consistency)
        updateDOMScores();
    }

    // Update all known DOM score displays
    function updateDOMScores() {
        const inGameElement = document.querySelector('.rounded-full.px-4.py-1\\.5.text-center.text-sm.font-bold.text-white.shadow-md.backdrop-blur-sm.sm\\:text-base.bg-red-600\\/70');
        if (inGameElement) {
            inGameElement.innerText = `You scored! Score: ${TARGET_SCORE}`;
            debugLog('Updated in-game DOM score');
        }

        const gameOverElement = document.querySelector('.mb-2.text-3xl.font-bold.text-white');
        if (gameOverElement) {
            gameOverElement.innerText = `Score: ${TARGET_SCORE}`;
            debugLog('Updated game over DOM score');
        }

        const confirmElement = document.querySelector('.text-center.text-lg.font-medium.text-white span.font-bold');
        if (confirmElement) {
            confirmElement.innerText = TARGET_SCORE.toString();
            debugLog('Updated confirmation DOM score');
        }
    }

    // Monitor and enforce the score
    function ensurePersistence() {
        setRealScore();
        const intervalId = setInterval(() => {
            const gameState = findGameState();
            if (gameState && gameState.player && gameState.player.score !== TARGET_SCORE) {
                gameState.player.score = TARGET_SCORE;
                debugLog('Re-enforced gameState.player.score to', TARGET_SCORE);
            }
            const reactScore = findReactPlayerScore();
            if (reactScore && reactScore.fiberNode.memoizedState.memoizedState !== TARGET_SCORE) {
                reactScore.setScore(TARGET_SCORE);
                debugLog('Re-enforced React playerScore state to', TARGET_SCORE);
            }
            updateDOMScores();
        }, CHECK_INTERVAL_MS);
        debugLog('Started interval to enforce score. Interval ID:', intervalId);

        // Hook into the setVolleyballHighScore mutation to ensure submitted score is 1,000,000
        const originalMutate = window.__NEXT_DATA__?.props?.pageProps?.mutate;
        if (originalMutate) {
            window.__NEXT_DATA__.props.pageProps.mutate = function(params) {
                debugLog('Intercepted setVolleyballHighScore mutation with params:', params);
                params.highScore = TARGET_SCORE;
                debugLog('Forced highScore to', TARGET_SCORE);
                return originalMutate.apply(this, [params]);
            };
            debugLog('Hooked into setVolleyballHighScore mutation');
        } else {
            debugLog('Could not hook into setVolleyballHighScore mutation');
        }
    }

    // Run the script
    debugLog('Starting score hack to set real score to', TARGET_SCORE);
    ensurePersistence();
})();
