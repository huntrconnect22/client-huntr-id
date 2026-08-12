import React, { useState } from 'react';
import { Trophy, Building2, Package, DollarSign, Calendar, MessageSquare, Loader2, FileText } from 'lucide-react';
import { getAssetUrl } from '../../lib/assets';

interface ProposalRankingsProps {
  rankings: any[];
  onAwardWinner?: (proposalId: string | number, rfqId: string | number) => Promise<void>;
  onOpenNegotiation?: (proposal: any) => void;
  awardingProposal?: string | number | null;
  requestId: string;
}

export function ProposalRankings({ 
  rankings, 
  onAwardWinner, 
  onOpenNegotiation,
  awardingProposal,
  requestId 
}: ProposalRankingsProps) {
  if (!rankings || rankings.length === 0) {
    return (
      <div style={{ 
        padding: 60, 
        textAlign: "center", 
        background: "var(--ui-bg-input)", 
        borderRadius: 32, 
        border: "1px dashed var(--ui-border)" 
      }}>
        <Package size={32} style={{ opacity: 0.1, marginBottom: 16 }} />
        <p style={{ margin: 0, fontSize: 14, color: "var(--ui-text-muted)" }}>
          No proposals received yet.
        </p>
      </div>
    );
  }

  const winners = rankings.filter(r => r.is_winner);
  const regularRankings = rankings.filter(r => !r.is_winner);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Winner Section */}
      {winners.length > 0 && (
        <div>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 12, 
            marginBottom: 16 
          }}>
            <div style={{ 
              padding: 10, 
              borderRadius: 12, 
              background: "rgba(34,197,94,0.1)", 
              color: "#22c55e" 
            }}>
              <Trophy size={20} />
            </div>
            <h3 style={{ 
              margin: 0, 
              fontSize: 18, 
              fontWeight: 800, 
              color: "var(--ui-text-primary)" 
            }}>
              Winner Selected
            </h3>
          </div>
          
          {winners.map((rankData, index) => {
            const winner = rankData.proposal;
            return (
              <div 
                key={winner.id} 
                style={{ 
                  background: "var(--ui-bg-card)", 
                  border: "2px solid #22c55e", 
                  borderRadius: 20, 
                  padding: 20 
                }}
              >
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "flex-start" 
                }}>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    <div style={{ 
                      padding: 12, 
                      borderRadius: 12, 
                      background: "rgba(34,197,94,0.1)", 
                      color: "#22c55e" 
                    }}>
                      <Building2 size={20} />
                    </div>
                    <div>
                      <div style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 8, 
                        marginBottom: 4 
                      }}>
                        <h4 style={{ 
                          fontSize: 16, 
                          fontWeight: 800, 
                          color: "var(--ui-text-primary)", 
                          margin: 0 
                        }}>
                          {winner.company?.name}
                        </h4>
                        <div style={{ 
                          padding: "2px 8px", 
                          borderRadius: 6, 
                          background: "#22c55e", 
                          color: "#fff", 
                          fontSize: 10, 
                          fontWeight: 800 
                        }}>
                          WINNER
                        </div>
                      </div>
                      <div style={{ 
                        fontSize: 12, 
                        color: "var(--ui-text-muted)" 
                      }}>
                        Delivery: {winner.delivery_days} days • Payment: {winner.payment_term}
                      </div>
                      {(winner.document_path || winner.document_url) && (
                        <div style={{ marginTop: 8 }}>
                          <a
                            href={winner.document_url || getAssetUrl(winner.document_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              color: "#22c55e",
                              fontSize: 12,
                              fontWeight: 700,
                              textDecoration: "none"
                            }}
                          >
                            <FileText size={13} style={{ display: "inline", marginRight: 4 }} /> Lihat Dokumen Vendor
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ 
                      fontSize: 10, 
                      fontWeight: 700, 
                      color: "var(--ui-text-muted)", 
                      textTransform: "uppercase" 
                    }}>
                      WINNING OFFER
                    </div>
                    <div style={{ 
                      fontSize: 20, 
                      fontWeight: 900, 
                      color: "#22c55e" 
                    }}>
                      Rp {Number(winner.price_offer).toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Regular Rankings */}
      {regularRankings.length > 0 && (
        <div>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 12, 
            marginBottom: 16 
          }}>
            <div style={{ 
              padding: 10, 
              borderRadius: 12, 
              background: "rgba(249,115,22,0.1)", 
              color: "var(--huntr-orange)" 
            }}>
              <Trophy size={20} />
            </div>
            <h3 style={{ 
              margin: 0, 
              fontSize: 18, 
              fontWeight: 800, 
              color: "var(--ui-text-primary)" 
            }}>
              Proposal Rankings
            </h3>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {regularRankings.map((rankData, index) => {
              const proposal = rankData.proposal;
              return (
                <div 
                  key={proposal.id} 
                  style={{ 
                    background: "var(--ui-bg-card)", 
                    border: "1px solid var(--ui-border)", 
                    borderRadius: 20, 
                    padding: 20 
                  }}
                >
                  <div style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "flex-start" 
                  }}>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <div style={{ 
                        width: 36, 
                        height: 36, 
                        borderRadius: 10, 
                        background: "var(--ui-bg-badge)", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center", 
                        fontSize: 14, 
                        fontWeight: 900, 
                        color: "var(--ui-text-brand)" 
                      }}>
                        #{rankData.rank}
                      </div>
                      <div>
                        <h4 style={{ 
                          fontSize: 16, 
                          fontWeight: 800, 
                          color: "var(--ui-text-primary)", 
                          margin: 0 
                        }}>
                          {proposal.company?.name}
                        </h4>
                        <div style={{ 
                          fontSize: 12, 
                          color: "var(--ui-text-muted)", 
                          marginTop: 4 
                        }}>
                          Delivery: {proposal.delivery_days} days • Payment: {proposal.payment_term}
                        </div>
                        {(proposal.document_path || proposal.document_url) && (
                          <div style={{ marginTop: 8 }}>
                            <a
                              href={proposal.document_url || getAssetUrl(proposal.document_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                color: "#f97316",
                                fontSize: 12,
                                fontWeight: 700,
                                textDecoration: "none"
                              }}
                            >
                              <FileText size={13} style={{ display: "inline", marginRight: 4 }} /> Lihat Dokumen Vendor
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ 
                        fontSize: 10, 
                        fontWeight: 700, 
                        color: "var(--ui-text-muted)", 
                        textTransform: "uppercase" 
                      }}>
                        TOTAL OFFER
                      </div>
                      <div style={{ 
                        fontSize: 20, 
                        fontWeight: 900, 
                        color: "var(--ui-text-primary)" 
                      }}>
                        Rp {Number(proposal.price_offer).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {(onAwardWinner || onOpenNegotiation) && (
                    <div style={{ 
                      display: "flex", 
                      justifyContent: "flex-end", 
                      gap: 12, 
                      marginTop: 16 
                    }}>
                      {onOpenNegotiation && (
                        <button
                          onClick={() => onOpenNegotiation(proposal)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 10,
                            background: "transparent",
                            border: "1px solid var(--ui-border-input)",
                            color: "var(--ui-text-secondary)",
                            fontWeight: 700,
                            fontSize: 12,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6
                          }}
                        >
                          <MessageSquare size={14} /> Negotiate
                        </button>
                      )}
                      
                      {onAwardWinner && (
                        <button 
                          onClick={() => onAwardWinner(proposal.id, requestId)}
                          disabled={awardingProposal === proposal.id}
                          style={{ 
                            padding: "8px 16px", 
                            borderRadius: 10, 
                            border: "none", 
                            background: "var(--huntr-gradient)", 
                            color: "#fff", 
                            fontSize: 12, 
                            fontWeight: 800, 
                            cursor: "pointer", 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            gap: 6 
                          }}
                        >
                          {awardingProposal === proposal.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <><Trophy size={14} /> Award Winner</>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}