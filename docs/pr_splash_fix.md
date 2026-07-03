## Fix: Stale closure in Splash screen onComplete callback

### Root Cause
The `onComplete` callback passed to the `Splash` component relied on the `screen` state variable from the parent component's closure. If the `screen` state changed before the `Splash` timer fired, the callback would use the stale `screen` value, potentially failing to transition the screen correctly.

### Changes
- Updated the `onComplete` callback in `src/App.tsx` for the `<Splash />` component to use a functional state update (`setScreen(prev => ...)`) instead of relying on the closed-over `screen` variable.

### Why this fixes the issue
Using functional state updates ensures the check (`prev === 'splash'`) is performed against the most current state value at the moment of execution, guaranteeing that the transition to the login screen happens reliably regardless of timing or component re-renders.
