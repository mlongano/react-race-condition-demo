import "./App.css";

import { useState, useEffect, useCallback } from "react";

type UserData = {
  id: number;
  name: string;
  email: string;
};

// Simulated API with variable delay to demonstrate race conditions
const fetchUserData = (userId: number, msg = ""): Promise<UserData> => {
  console.log(`${msg}Fetching user ${userId}...`);
  // Simulate network delay - user 1 takes longer than user 2
  const delay = userId === 1 ? 3000 : 1000;

  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`${msg}Received data for user ${userId}`);
      resolve({
        id: userId,
        name: `User ${userId}`,
        email: `user${userId}@example.com`,
      });
    }, delay);
  });
};

// Component demonstrating both approaches
function RaceConditionDemo() {
  const [userId, setUserId] = useState(1);

  // Toggle between users to trigger race condition
  const toggleUser = () => {
    setUserId((prevId) => (prevId === 1 ? 2 : 1));
  };

  return (
    <div className="race-condition-demo">
      <h2>Race Condition Demonstration</h2>
      <div className="user-controls">
        <p>Current User ID: {userId}</p>
        <button onClick={toggleUser}>Toggle User</button>
        <p>
          <small>
            Click "Toggle User" quickly to simulate race condition. Check
            console for request/response logs.
          </small>
        </p>
      </div>

      <div className="demo-containers">
        <WithoutCleanup userId={userId} />
        <WithCleanup userId={userId} />
      </div>
    </div>
  );
}

// Component WITHOUT proper cleanup - will have race conditions
function WithoutCleanup({ userId }: { userId: number }) {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log(
      `\x1b[31m[WITHOUT CLEANUP]\x1b[0m Effect running for userId=${userId}`,
    );
    setLoading(true);

    fetchUserData(userId, "\x1b[31m[WITHOUT CLEANUP]\x1b[0m").then(
      (userData) => {
        console.log(
          `\x1b[31m[WITHOUT CLEANUP]\x1b[0m Setting state for userId=${userId}`,
        );
        setData(userData);
        setLoading(false);
      },
    );

    // No cleanup function!
  }, [userId]);

  return (
    <div className="demo-panel">
      <h3>Without Cleanup (Race Condition Possible)</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="user-data">
          <p>
            <strong>ID:</strong> {data?.id}
          </p>
          <p>
            <strong>Name:</strong> {data?.name}
          </p>
          <p>
            <strong>Email:</strong> {data?.email}
          </p>
          <p className="timestamp">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}

// Component WITH proper cleanup - prevents race conditions
function WithCleanup({ userId }: { userId: number }) {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Memoize the fetch function with useCallback
  const fetchUser = useCallback(() => {
    console.log(
      `\x1b[32m[WITH CLEANUP]\x1b[0m fetchUser called for userId=${userId}`,
    );
    return fetchUserData(userId, "\x1b[32m[WITH CLEANUP]\x1b[0m");
  }, [userId]);

  useEffect(() => {
    console.log(
      `\x1b[32m[WITH CLEANUP]\x1b[0m Effect running for userId=${userId}`,
    );
    setLoading(true);

    // Track if component is still mounted for this effect instance
    let isMounted = true;

    fetchUser().then((userData: UserData) => {
      if (isMounted) {
        console.log(
          `\x1b[32m[WITH CLEANUP]\x1b[0m Setting state for userId=${userId} (isMounted=${isMounted})`,
        );
        setData(userData);
        setLoading(false);
      } else {
        console.log(
          `\x1b[32m[WITH CLEANUP]\x1b[0m Ignoring response for userId=${userId} (isMounted=${isMounted})`,
        );
      }
    });

    // Cleanup function that runs when effect is re-executed or component unmounts
    return () => {
      console.log(`\x1b[32m[WITH CLEANUP]\x1b[0m Cleanup for userId=${userId}`);
      isMounted = false;
    };
  }, [fetchUser]);

  return (
    <div className="demo-panel">
      <h3>With Cleanup (Race Condition Prevented)</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="user-data">
          <p>
            <strong>ID:</strong> {data?.id}
          </p>
          <p>
            <strong>Name:</strong> {data?.name}
          </p>
          <p>
            <strong>Email:</strong> {data?.email}
          </p>
          <p className="timestamp">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}

export default RaceConditionDemo;
