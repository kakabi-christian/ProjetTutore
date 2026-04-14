import React from 'react';
import {
  MdSwapHoriz, MdCheckCircle, MdCancel, MdHourglassTop,
  MdErrorOutline, MdArrowUpward, MdArrowDownward,
  MdThumbUp, MdThumbDown, MdAccessTime,
} from 'react-icons/md';
import type { Transaction } from '../services/Transactionservice';

// ─── Config visuelle par statut ──────────────────────────────────────────────
export const STATUS_CONFIG: Record<string, { label: string; badgeClass: string; Icon: any }> = {
  PENDING: {
    label: 'En attente de paiement',
    badgeClass: 'badge-status-pending',
    Icon: MdHourglassTop,
  },
  AWAITING_SELLER: {
    label: 'En attente du vendeur',
    badgeClass: 'badge-status-awaiting',
    Icon: MdAccessTime,
  },
  COMPLETED: {
    label: 'Complété',
    badgeClass: 'badge-status-success',
    Icon: MdCheckCircle,
  },
  CANCELLED: {
    label: 'Annulé',
    badgeClass: 'badge-status-cancelled',
    Icon: MdCancel,
  },
  FAILED: {
    label: 'Échoué',
    badgeClass: 'badge-status-failed',
    Icon: MdErrorOutline,
  },
};

export function fmt(n: string | number, decimals = 2): string {
  return Number(n).toLocaleString('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

interface TransactionCardProps {
  tx: Transaction;
  currentUserId: number | null;
  onAccept: (tx: Transaction) => void;
  onCancel: (tx: Transaction) => void;
  actionLoading?: 'accept' | 'cancel' | null;
  innerRef?: React.Ref<HTMLDivElement>;
}

export default function TransactionCard({
  tx,
  currentUserId,
  onAccept,
  onCancel,
  actionLoading,
  innerRef,
}: TransactionCardProps) {
  const isBuyer   = tx.buyer_id === currentUserId;
  const isSeller  = tx.seller_id === currentUserId;
  const cfg       = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.PENDING;
  const { Icon }  = cfg;
  
  const currFrom  = tx.listing?.currency_from ?? '—';
  const currTo    = tx.listing?.currency_to   ?? '—';
  const isAwaiting = tx.status === 'AWAITING_SELLER';

  const counterpart = isBuyer
    ? (tx.seller ? `${tx.seller.firstname} ${tx.seller.lastname}` : 'Vendeur inconnu')
    : (tx.buyer  ? `${tx.buyer.firstname} ${tx.buyer.lastname}`   : 'Acheteur inconnu');

  return (
    <div
      ref={innerRef}
      className={`tx-card rounded-4 bg-white p-4 shadow-sm ${isAwaiting && isSeller ? 'tx-card-action-required' : ''}`}
    >
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-3">
        {/* Icône + rôle */}
        <div className="d-flex align-items-center gap-3">
          <div className={`tx-icon-wrap ${isBuyer ? 'buyer' : 'seller'}`}>
            <MdSwapHoriz size={26} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2 mb-1 flex-wrap">
              <span className={`tx-role-badge ${isBuyer ? 'buyer' : 'seller'}`}>
                {isBuyer
                  ? <><MdArrowDownward size={12} className="me-1" />Acheteur</>
                  : <><MdArrowUpward size={12} className="me-1" />Vendeur</>}
              </span>
              <span className={`tx-status-badge ${cfg.badgeClass}`}>
                <Icon size={12} className="me-1" />
                {cfg.label}
              </span>
            </div>
            <div className="fw-semibold small text-dark">
              Avec : <span className="text-muted">{counterpart}</span>
            </div>
          </div>
        </div>

        {/* Montants */}
        <div className="text-end">
          <div className="fw-black" style={{ fontSize: '1.1rem', color: '#FF7A00' }}>
            {fmt(tx.amount_from)} <span className="small text-muted fw-normal">{currFrom}</span>
          </div>
          <div className="small text-muted">
            → {fmt(tx.amount_to)} {currTo}
          </div>
          <div style={{ fontSize: '10px' }} className="text-muted mt-1">
            Taux : 1 {currFrom} = {fmt(tx.exchange_rate)} {currTo}
          </div>
        </div>
      </div>

      <hr className="my-3 opacity-10" />

      {/* Footer */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex gap-3">
          <div>
            <div style={{ fontSize: '10px' }} className="text-muted fw-bold text-uppercase">Frais</div>
            <div className="small fw-semibold text-dark">
              {fmt(isBuyer ? tx.buyer_fee : tx.seller_fee)} {isBuyer ? currTo : currFrom}
            </div>
          </div>
        </div>
        <div className="text-muted" style={{ fontSize: '11px' }}>
          {fmtDate(tx.created_at)}
        </div>
      </div>

      {/* ─── Boutons d'action vendeur ───────────────────────────── */}
      {isSeller && isAwaiting && (
        <div className="mt-3 pt-3" style={{ borderTop: '1px dashed #FFD699' }}>
          <p className="small text-muted mb-2" style={{ fontSize: '12px' }}>
            <MdAccessTime size={13} className="me-1 text-warning" />
            L'acheteur a payé. Acceptez pour procéder à l'envoi de{' '}
            <strong>{fmt(tx.amount_from)} {currFrom}</strong>, ou annulez pour le rembourser.
          </p>
          <div className="d-flex gap-2">
            {/* Bouton Accepter */}
            <button
              onClick={() => onAccept(tx)}
              disabled={actionLoading !== undefined && actionLoading !== null}
              className="btn btn-sm fw-bold rounded-pill flex-grow-1 d-flex align-items-center justify-content-center gap-1"
              style={{
                background: actionLoading === 'accept' ? '#ccc' : '#16a34a',
                color: '#fff', border: 'none',
                padding: '8px 16px',
              }}
            >
              {actionLoading === 'accept' ? (
                <span className="spinner-border spinner-border-sm" />
              ) : (
                <><MdThumbUp size={15} /> Accepter</>
              )}
            </button>

            {/* Bouton Annuler */}
            <button
              onClick={() => onCancel(tx)}
              disabled={actionLoading !== undefined && actionLoading !== null}
              className="btn btn-sm fw-bold rounded-pill flex-grow-1 d-flex align-items-center justify-content-center gap-1"
              style={{
                background: 'transparent',
                color: '#dc2626',
                border: '1.5px solid #dc2626',
                padding: '8px 16px',
              }}
            >
              {actionLoading === 'cancel' ? (
                <span className="spinner-border spinner-border-sm" style={{ color: '#dc2626' }} />
              ) : (
                <><MdThumbDown size={15} /> Annuler et rembourser</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Acheteur en attente */}
      {isBuyer && isAwaiting && (
        <div className="mt-3 pt-3 d-flex align-items-center gap-2"
          style={{ borderTop: '1px dashed #FFD699', fontSize: '12px', color: '#d97706' }}>
          <MdAccessTime size={15} />
          <span>En attente de validation du vendeur — vous serez notifié dès qu'il répond.</span>
        </div>
      )}

      {/* Référence */}
      {tx.flw_tx_ref && (
        <div className="mt-2 font-monospace text-muted" style={{ fontSize: '10px' }}>
          Réf : {tx.flw_tx_ref}
        </div>
      )}
    </div>
  );
}
