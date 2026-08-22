// FR-02: User Login & Session — read-only account summary
// Profile editing is not built yet.

import { useAuth } from "../AuthContext.jsx";

function Profile() {
  const { user } = useAuth();

  return (
    <main className="page page-narrow">
      <h1>Profile</h1>
      <p>Your account details. Editing will be added in a later feature.</p>

      <dl className="profile-list">
        <div>
          <dt>Name</dt>
          <dd>{user?.name}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{user?.email}</dd>
        </div>
        <div>
          <dt>City</dt>
          <dd>{user?.city ? user.city : "Not set"}</dd>
        </div>
        <div>
          <dt>Account</dt>
          <dd>{user?.accountType}</dd>
        </div>
      </dl>
    </main>
  );
}

export default Profile;
