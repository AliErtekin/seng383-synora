import React from 'react';
import Schedule from './Schedule.jsx';
import Tasks from './Tasks.jsx';

// Child home: only the child's own tasks and this week's events (FR-M3-03, FR-M4-04).
export default function ChildHome({ user }) {
  if (!user.childProfileId) {
    return <p className="error">This child account has no profile yet. Ask your parent.</p>;
  }
  return (
    <div className="child-grid">
      <Tasks childId={user.childProfileId} user={user} />
      <Schedule childId={user.childProfileId} canAdd={false} upcomingOnly />
    </div>
  );
}
