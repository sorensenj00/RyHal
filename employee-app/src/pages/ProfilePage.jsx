import { useEmployeePortal } from "../portal/EmployeePortalContext";

function ProfilePage() {
  const { profile } = useEmployeePortal();

  return (
    <section className="employee-grid">
      <article className="panel panel-full">
        <div className="panel-header">
          <h2>Profil</h2>
          <span>Din konto</span>
        </div>

        <div className="panel-content">
          <div className="info-list">
            <div>
              <span>Navn</span>
              <strong>
                {profile?.firstName} {profile?.lastName}
              </strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{profile?.email}</strong>
            </div>
            <div>
              <span>Medarbejder-ID</span>
              <strong>{profile?.employeeId}</strong>
            </div>
            <div>
              <span>Supabase ID</span>
              <strong>{profile?.supabaseUserId}</strong>
            </div>
            <div>
              <span>App-adgang</span>
              <strong>{profile?.appAccess}</strong>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}

export default ProfilePage;
