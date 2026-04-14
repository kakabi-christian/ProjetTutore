import { useEffect, useState, useCallback, useRef } from "react";
import {
  MdSwapHoriz,
  MdCheckCircle,
  MdCancel,
  MdHourglassTop,
  MdErrorOutline,
  MdArrowUpward,
  MdArrowDownward,
  MdReceipt,
  MdThumbUp,
  MdThumbDown,
  MdAccessTime,
  MdOpenInNew,
} from "react-icons/md";
import {
  transactionService,
  type Transaction,
} from "../../../services/Transactionservice";
import TransactionCard from "../../../components/TransactionCard";

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; Icon: any }
> = {
  PENDING: {
    label: "Attente paiement",
    badgeClass: "badge-status-pending",
    Icon: MdHourglassTop,
  },
  AWAITING_SELLER: {
    label: "Attente vendeur",
    badgeClass: "badge-status-awaiting",
    Icon: MdAccessTime,
  },
  AWAITING_SELLER_PAYMENT: {
    label: "Paiement vendeur",
    badgeClass: "badge-status-awaiting",
    Icon: MdAccessTime,
  },
  COMPLETED: {
    label: "Complété",
    badgeClass: "badge-status-success",
    Icon: MdCheckCircle,
  },
  CANCELLED: {
    label: "Annulé",
    badgeClass: "badge-status-cancelled",
    Icon: MdCancel,
  },
  FAILED: {
    label: "Échoué",
    badgeClass: "badge-status-failed",
    Icon: MdErrorOutline,
  },
};

function getCurrentUserId(): number | null {
  try {
    const raw = localStorage.getItem("user_data");
    if (!raw) return null;
    return JSON.parse(raw)?.user_id ?? null;
  } catch {
    return null;
  }
}

function fmt(n: string | number, decimals = 2): string {
  return Number(n).toLocaleString("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MarketTransaction() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState<
    Record<number, "accept" | "cancel" | null>
  >({});

  const currentUserId = getCurrentUserId();
  const observer = useRef<IntersectionObserver | null>(null);

  const fetchTransactions = useCallback(
    async (targetPage: number, isRefresh = false) => {
      try {
        if (targetPage === 1) setLoading(true);
        else setLoadingMore(true);
        const response =
          await transactionService.getUserTransactions(targetPage);
        setTransactions((prev) =>
          targetPage === 1 || isRefresh
            ? response.data
            : [
                ...prev,
                ...response.data.filter(
                  (n) =>
                    !prev.some((p) => p.transaction_id === n.transaction_id),
                ),
              ],
        );
        setHasMore(response.current_page < response.last_page);
      } catch {
        setError("Impossible de charger vos transactions.");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchTransactions(1);
  }, []);
  useEffect(() => {
    if (page > 1) fetchTransactions(page);
  }, [page]);

  const lastTxRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) setPage((p) => p + 1);
        },
        { threshold: 0.8 },
      );
      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore],
  );

  // ─── Accepter → redirige le vendeur vers Flutterwave ─────────────────────
  const handleAccept = async (tx: Transaction) => {

    setActionLoading((prev) => ({ ...prev, [tx.transaction_id]: "accept" }));
    try {
      const result = await transactionService.accept(tx.transaction_id);

      // Mettre à jour le statut localement
      setTransactions((prev) =>
        prev.map((t) =>
          t.transaction_id === tx.transaction_id
            ? { ...t, status: "AWAITING_SELLER_PAYMENT" }
            : t,
        ),
      );

      // Rediriger vers Flutterwave pour le paiement vendeur
      window.location.href = result.payment_link;
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Erreur lors de l'acceptation.");
      setActionLoading((prev) => ({ ...prev, [tx.transaction_id]: null }));
    }
  };

  // ─── Annuler → remboursement acheteur ────────────────────────────────────
  const handleCancel = async (tx: Transaction) => {
    if (
      !confirm(
        `Annuler cet échange ?\n\nL'acheteur sera remboursé automatiquement via Flutterwave.`,
      )
    )
      return;

    setActionLoading((prev) => ({ ...prev, [tx.transaction_id]: "cancel" }));
    try {
      await transactionService.cancel(tx.transaction_id);
      setTransactions((prev) =>
        prev.map((t) =>
          t.transaction_id === tx.transaction_id
            ? { ...t, status: "CANCELLED" }
            : t,
        ),
      );
    } catch (err: any) {
      alert(err?.response?.data?.message ?? "Erreur lors de l'annulation.");
    } finally {
      setActionLoading((prev) => ({ ...prev, [tx.transaction_id]: null }));
    }
  };

  const filtered =
    activeFilter === "ALL"
      ? transactions
      : transactions.filter((tx) => tx.status === activeFilter);

  const filters = [
    { key: "ALL", label: "Toutes" },
    { key: "AWAITING_SELLER", label: "Action requise" },
    { key: "AWAITING_SELLER_PAYMENT", label: "Paiement en cours" },
    { key: "PENDING", label: "En attente" },
    { key: "COMPLETED", label: "Complétées" },
    { key: "CANCELLED", label: "Annulées" },
  ];

  return (
    <div className="tx-page w-100 py-4 px-3">
      <div className="mx-auto" style={{ maxWidth: "900px" }}>
        <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
          <div>
            <h2
              className="fw-black mb-0 text-dark"
              style={{ letterSpacing: "-0.5px" }}
            >
              Mes transactions
            </h2>
            <p className="text-muted small mb-0">
              Historique de vos échanges en tant qu'acheteur et vendeur
            </p>
          </div>
          <button
            className="btn btn-sm rounded-pill fw-bold px-4 py-2"
            style={{ background: "#FF7A00", color: "#fff", border: "none" }}
            onClick={() => fetchTransactions(1, true)}
          >
            Actualiser
          </button>
        </div>

        <div className="d-flex gap-2 flex-wrap mb-4">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`tx-filter-pill ${activeFilter === f.key ? "active" : ""} ${
                f.key === "AWAITING_SELLER" ? "awaiting-pill" : ""
              }`}
            >
              {f.key === "AWAITING_SELLER" && <span className="awaiting-dot" />}
              {f.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="alert alert-danger rounded-4 d-flex align-items-center gap-2 small">
            <MdErrorOutline size={20} /> {error}
          </div>
        )}

        {loading ? (
          <div className="row g-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="col-12">
                <div className="tx-skeleton rounded-4" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="tx-empty text-center py-5">
            <MdReceipt size={64} className="text-muted opacity-25 mb-3" />
            <p className="fw-bold text-muted">Aucune transaction trouvée</p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filtered.map((tx, idx) => {
              const isLast = idx === filtered.length - 1;

              return (
                <TransactionCard
                  key={tx.transaction_id}
                  tx={tx}
                  currentUserId={currentUserId}
                  onAccept={handleAccept}
                  onCancel={handleCancel}
                  actionLoading={actionLoading[tx.transaction_id]}
                  innerRef={isLast ? lastTxRef : undefined}
                />
              );
            })}

            {loadingMore && (
              <div className="text-center py-3">
                <div
                  className="spinner-border spinner-border-sm"
                  style={{ color: "#FF7A00" }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        .tx-page { background: transparent; min-height: 90vh; }
        .fw-black { font-weight: 900; }
        .tx-filter-pill {
          padding: 8px 20px; border-radius: 50px; border: 1.5px solid #e5e7eb;
          background: #fff; font-size: 13px; font-weight: 700; color: #6b7280;
          transition: all 0.2s; white-space: nowrap;
          display: inline-flex; align-items: center; gap: 6px;
        }
        .tx-filter-pill.active { background: #1a1a1b; color: #fff; border-color: #1a1a1b; }
        .tx-filter-pill:hover:not(.active) { border-color: #FF7A00; color: #FF7A00; }
        .awaiting-pill:not(.active) { border-color: #f59e0b; color: #d97706; }
        .awaiting-pill.active { background: #f59e0b; border-color: #f59e0b; }
        .awaiting-dot {
          width: 7px; height: 7px; border-radius: 50%; background: #f59e0b; flex-shrink: 0;
          animation: blink 1.2s ease-in-out infinite;
        }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .tx-card { border: 1.5px solid #f0f0f0; transition: all 0.25s; }
        .tx-card:hover { border-color: rgba(255,122,0,0.2); box-shadow: 0 8px 24px rgba(255,122,0,0.08) !important; transform: translateY(-2px); }
        .tx-card-action-required { border-color: #FFC46B !important; background: linear-gradient(to bottom,#fffdf9,#fff) !important; }
        .tx-icon-wrap { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tx-icon-wrap.buyer  { background: #fff0e0; color: #FF7A00; }
        .tx-icon-wrap.seller { background: #eef2ff; color: #4f46e5; }
        .tx-role-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        .tx-role-badge.buyer  { background: #fff0e0; color: #FF7A00; }
        .tx-role-badge.seller { background: #eef2ff; color: #4f46e5; }
        .tx-status-badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; letter-spacing: 0.5px; }
        .badge-status-pending   { background: #fef3c7; color: #d97706; }
        .badge-status-awaiting  { background: #fff3cd; color: #b45309; }
        .badge-status-success   { background: #dcfce7; color: #16a34a; }
        .badge-status-cancelled { background: #f3f4f6; color: #6b7280; }
        .badge-status-failed    { background: #fee2e2; color: #dc2626; }
        .tx-skeleton { height: 130px; background: linear-gradient(90deg,#f0f0f0 25%,#e8e8e8 50%,#f0f0f0 75%); background-size: 200% 100%; animation: txShimmer 1.4s infinite; }
        @keyframes txShimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .tx-empty { opacity: 0.7; }
      `}</style>
    </div>
  );
}
