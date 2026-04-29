import { useEmployeePortal } from "../portal/EmployeePortalContext";
import { formatDate } from "./portalUtils";

function SwapsPage() {
  const { swapRequests } = useEmployeePortal();

  return (
    <section className="panel panel-full">
      <div className="panel-header">
        <h2>Bytteforespørgsler</h2>
        <span>{swapRequests.length} total</span>
      </div>

      <div className="stack-list">
        {swapRequests.length > 0 ? (
          swapRequests.map((swap) => (
            <div key={swap.swapRequestId} className="stacked-card">
              <strong>Swap #{swap.swapRequestId}</strong>
              <p>Status: {swap.status?.name || "Ukendt"}</p>
              <p>
                Requester: {swap.requesterId} • Target: {swap.targetEmployeeId}
              </p>
              <p>Oprettet: {formatDate(swap.createdAt)}</p>
            </div>
          ))
        ) : (
          <p className="empty-state">Ingen bytteforespørgsler for dig endnu.</p>
        )}
      </div>
    </section>
  );
}

export default SwapsPage;
