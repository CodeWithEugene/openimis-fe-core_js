import React, { useState, useEffect } from "react";
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Button, 
  TextField, 
  Box, 
  Divider, 
  List, 
  ListItem, 
  ListItemText,
  IconButton,
  Alert,
  Chip
} from "@mui/material";
import GetIconComponent from "../helpers/icons";

const AccountBox = GetIconComponent("AccountBox");
const Shield = GetIconComponent("Security");
const Wallet = GetIconComponent("AccountBalanceWallet");
const Smartphone = GetIconComponent("PhoneAndroid");
const Brain = GetIconComponent("Psychology");
const Audit = GetIconComponent("CheckCircle");
const Refresh = GetIconComponent("Refresh");
const VolumeUp = GetIconComponent("VolumeUp");
const VolumeOff = GetIconComponent("VolumeOff");

export default function MediTrustDashboard() {
  const [activeTab, setActiveTab] = useState("payments");
  const [policyUuid, setPolicyUuid] = useState("");
  const [chfId, setChfId] = useState("");
  const [payAmount, setPayAmount] = useState("1500");
  const [payRef, setPayRef] = useState("");
  const [payPhone, setPayPhone] = useState("+254712345678");
  const [coverageData, setCoverageData] = useState(null);
  
  // USSD Claim Verification trigger fields
  const [claimRef, setClaimRef] = useState("CL-9821");
  const [patientPhone, setPatientPhone] = useState("+254712345678");
  const [claimAmount, setClaimAmount] = useState("3400");
  const [facilityName, setFacilityName] = useState("Strathmore Health Center");
  const [serviceDesc, setServiceDesc] = useState("Malaria Lab Testing + Treatment");

  // AI Screener
  const [ocrText, setOcrText] = useState("Diagnosis: Severe malaria. Impression: Cerebral malaria complications.");
  const [scrAmount, setScrAmount] = useState("8200");
  const [scrHistory, setScrHistory] = useState("3800");
  const [scrDates, setScrDates] = useState("2026-07-01, 2026-07-02");
  const [scrResult, setScrResult] = useState(null);

  // Blockchain Ledger & Trust scores
  const [ledgerData, setLedgerData] = useState(null);
  const [trustScores, setTrustScores] = useState([]);

  // Chatbot
  const [chatMessages, setChatMessages] = useState([
    { sender: "bot", text: "🤖 Hello! I am the MediTrust Accessibility Assistant. Ask me about policies, ICD-10 codes, or voice screen-readers." }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [ttsEnabled, setTtsEnabled] = useState(false);

  useEffect(() => {
    setPayRef("PAY-REF-" + Math.floor(Math.random() * 1000000));
    fetchTrustScores();
    fetchLedger();
  }, []);

  const fetchTrustScores = async () => {
    try {
      const res = await fetch("/meditrust/trust-scores/");
      const data = await res.json();
      setTrustScores(data.providers || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await fetch("/meditrust/audit-ledger/");
      const data = await res.json();
      setLedgerData(data);
    } catch (e) {
      console.error(e);
    }
  };

  const checkCoverage = async () => {
    if (!chfId) return;
    try {
      const res = await fetch("/api/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `query {
            insurees(chfId: "${chfId}") {
              edges {
                node {
                  chfId
                  otherNames
                  lastName
                  phone
                  dob
                }
              }
            }
          }`
        })
      });
      const data = await res.json();
      const nodes = data.data?.insurees?.edges;
      if (nodes && nodes.length > 0) {
        setCoverageData(nodes[0].node);
        setPolicyUuid(nodes[0].node.chfId);
      } else {
        setCoverageData({ error: "Insuree not found" });
      }
    } catch (e) {
      setCoverageData({ error: "Query failed: " + e.message });
    }
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/meditrust/paystack-callback/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Paystack-Signature": "test_signature"
        },
        body: JSON.stringify({
          event: "charge.success",
          data: {
            reference: payRef,
            id: Math.floor(Math.random() * 10000),
            amount: parseFloat(payAmount) * 100,
            currency: "KES",
            customer: { email: "patient@strathmore.edu" },
            metadata: {
              phone_number: payPhone,
              policy_uuid: policyUuid,
            }
          }
        })
      });
      if (res.ok) {
        alert("Premium payment successfully processed!");
        setPayRef("PAY-REF-" + Math.floor(Math.random() * 1000000));
        fetchLedger();
      } else {
        alert("Payment webhook simulation failed.");
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const triggerVerification = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/meditrust/verifications/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_reference: claimRef,
          phone_number: patientPhone,
          amount: parseFloat(claimAmount),
          service_description: serviceDesc,
          facility_name: facilityName
        })
      });
      if (res.ok) {
        alert("Claim verification request successfully sent!");
        fetchLedger();
      } else {
        alert("Verification trigger failed.");
      }
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const evaluateClaim = async () => {
    try {
      const res = await fetch("/meditrust/ocr-process/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claim_amount: parseFloat(scrAmount),
          historical_average_cost: parseFloat(scrHistory),
          ocr_text: ocrText,
          service_dates: scrDates.split(",").map(d => d.trim())
        })
      });
      const data = await res.json();
      setScrResult(data);
      fetchLedger();
    } catch (e) {
      alert("Evaluation failed: " + e.message);
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput) return;
    const msg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { sender: "user", text: msg }]);

    try {
      const res = await fetch("/meditrust/chatbot/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, language: "en" })
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, { sender: "bot", text: data.reply }]);

      if (ttsEnabled && 'speechSynthesis' in window) {
        const clean = data.reply.replace(/[*`#]/g, "");
        const utterance = new SpeechSynthesisUtterance(clean);
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#006374" }}>
            MediTrust Integration Dashboard
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Universal Health Financing & Participatory Fraud Screening Core Interface
          </Typography>
        </Box>
        <Chip label="Module Active" color="success" size="small" variant="outlined" />
      </Box>

      <Grid container spacing={3}>
        {/* Navigation panel */}
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: 4 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ px: 2, mb: 1, fontWeight: "bold", color: "text.secondary" }}>
                NAVIGATION
              </Typography>
              <List>
                <ListItem button onClick={() => setActiveTab("payments")} selected={activeTab === "payments"}>
                  <ListItemText primary="Mobile Payments" />
                </ListItem>
                <ListItem button onClick={() => setActiveTab("ussd")} selected={activeTab === "ussd"}>
                  <ListItemText primary="USSD Verifications" />
                </ListItem>
                <ListItem button onClick={() => setActiveTab("ocr")} selected={activeTab === "ocr"}>
                  <ListItemText primary="AI Pre-Adjudication" />
                </ListItem>
                <ListItem button onClick={() => setActiveTab("ledger")} selected={activeTab === "ledger"}>
                  <ListItemText primary="Trust Ledger Audit" />
                </ListItem>
                <ListItem button onClick={() => setActiveTab("chatbot")} selected={activeTab === "chatbot"}>
                  <ListItemText primary="Accessibility Assistant" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Dynamic content panels */}
        <Grid item xs={12} md={9}>
          {activeTab === "payments" && (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                  Idempotent Mobile Premium Webhook Simulation
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box component="form" onSubmit={submitPayment} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <TextField label="Policy UUID or Insuree CHF ID" value={policyUuid} onChange={e => setPolicyUuid(e.target.value)} size="small" required fullWidth />
                      <TextField label="Amount (KES)" value={payAmount} onChange={e => setPayAmount(e.target.value)} size="small" required fullWidth />
                      <TextField label="Reference" value={payRef} onChange={e => setPayRef(e.target.value)} size="small" required fullWidth />
                      <TextField label="Payer Phone" value={payPhone} onChange={e => setPayPhone(e.target.value)} size="small" required fullWidth />
                      <Button type="submit" variant="contained" sx={{ bgcolor: "#006374", "&:hover": { bgcolor: "#004d5a" } }}>
                        Simulate Payment Webhook
                      </Button>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ border: "1px solid rgba(0,0,0,0.08)", p: 2, borderRadius: 3, bgcolor: "rgba(0,0,0,0.02)", minHeight: 220 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 2 }}>
                        Query openIMIS Insuree Coverage
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                        <TextField label="Insuree CHF ID" value={chfId} onChange={e => setChfId(e.target.value)} size="small" />
                        <Button onClick={checkCoverage} variant="outlined">Query</Button>
                      </Box>
                      {coverageData ? (
                        coverageData.error ? (
                          <Typography variant="body2" color="error">{coverageData.error}</Typography>
                        ) : (
                          <Box sx={{ fontSize: 12 }}>
                            <Typography variant="body2" sx={{ fontWeight: "bold" }}>Name: {coverageData.otherNames} {coverageData.lastName}</Typography>
                            <Typography variant="body2">Phone: {coverageData.phone || "N/A"}</Typography>
                            <Typography variant="body2">DOB: {coverageData.dob}</Typography>
                            <Typography variant="body2" color="success.main" sx={{ mt: 1, fontWeight: "bold" }}>✓ Coverage Verified</Typography>
                          </Box>
                        )
                      ) : (
                        <Typography variant="body2" color="text.secondary">Enter a CHF ID above to query the database.</Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {activeTab === "ussd" && (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                  Participatory Verification prompt trigger
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={7}>
                    <Box component="form" onSubmit={triggerVerification} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <TextField label="Claim Reference" value={claimRef} onChange={e => setClaimRef(e.target.value)} size="small" required />
                      <TextField label="Patient Phone" value={patientPhone} onChange={e => setPatientPhone(e.target.value)} size="small" required />
                      <TextField label="Claim Amount" value={claimAmount} onChange={e => setClaimAmount(e.target.value)} size="small" required />
                      <TextField label="Clinic Name" value={facilityName} onChange={e => setFacilityName(e.target.value)} size="small" required />
                      <TextField label="Service Description" value={serviceDesc} onChange={e => setServiceDesc(e.target.value)} size="small" required />
                      <Button type="submit" variant="contained" sx={{ bgcolor: "#006374" }}>
                        Send SMS Verification
                      </Button>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <Box sx={{ border: "1px solid rgba(0,0,0,0.08)", p: 2, borderRadius: 3, bgcolor: "rgba(0,0,0,0.02)" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                        Active verification flows
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Click on the local HTML5 dashboard link to test the interactive simulated phone and dial the USSD codes.
                      </Typography>
                      <Button variant="outlined" component="a" href="/meditrust/dashboard/" target="_blank" size="small">
                        Open Terminal Simulator
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {activeTab === "ocr" && (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                  AI Pre-Adjudication Claims Screening
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <TextField label="Clinical Report Text / Invoice" value={ocrText} onChange={e => setOcrText(e.target.value)} multiline rows={4} size="small" />
                      <TextField label="Claimed Amount" value={scrAmount} onChange={e => setScrAmount(e.target.value)} size="small" />
                      <TextField label="History Average" value={scrHistory} onChange={e => setScrHistory(e.target.value)} size="small" />
                      <TextField label="Service Visit Dates" value={scrDates} onChange={e => setScrDates(e.target.value)} size="small" />
                      <Button onClick={evaluateClaim} variant="contained" sx={{ bgcolor: "#006374" }}>
                        Evaluate Risk
                      </Button>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ border: "1px solid rgba(0,0,0,0.08)", p: 2, borderRadius: 3, bgcolor: "rgba(0,0,0,0.02)", minHeight: 300 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: "bold", mb: 1 }}>
                        Risk classification result
                      </Typography>
                      {scrResult ? (
                        <Box sx={{ fontSize: 12, display: "flex", flexDirection: "column", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: "bold" }}>Prediction: {scrResult.prediction.toUpperCase()}</Typography>
                          <Typography variant="body2">Risk Score: {Math.round(scrResult.risk_score * 100)}%</Typography>
                          <Typography variant="body2" sx={{ fontWeight: "bold", mt: 1 }}>Mapped codes:</Typography>
                          {scrResult.icd10_mappings?.map((m, idx) => (
                            <Box key={idx} sx={{ ml: 1 }}>• {m.icd10_code}: {m.description}</Box>
                          ))}
                          <Typography variant="body2" sx={{ fontWeight: "bold", mt: 1 }}>Reasons:</Typography>
                          {scrResult.explainable_reasons?.map((r, idx) => (
                            <Box key={idx} sx={{ ml: 1 }} color="error.main">• {r}</Box>
                          ))}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">Enter claims parameters to score.</Typography>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {activeTab === "ledger" && (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Cryptographic trust anchors
                  </Typography>
                  <IconButton onClick={fetchLedger}><Refresh /></IconButton>
                </Box>
                {ledgerData ? (
                  <Box>
                    <Alert severity={ledgerData.ledger_intact ? "success" : "error"} sx={{ mb: 2 }}>
                      {ledgerData.ledger_intact ? "Tamper-evident ledger integrity verified successfully!" : "Verification broken! Historian overrides detected."}
                    </Alert>
                    <Box sx={{ maxHeight: 300, overflowY: "auto", border: "1px solid #ddd", borderRadius: 2 }}>
                      <List dense>
                        {ledgerData.anchors?.map((a, idx) => (
                          <React.Fragment key={idx}>
                            <ListItem>
                              <ListItemText 
                                primary={`#${a.chain_index} - Type: ${a.record_type} (ID: ${a.record_id})`} 
                                secondary={`Chained hash: ${a.chained_hash.substring(0, 24)}... (Tx: ${a.tx_hash.substring(0, 16)}...)`} 
                              />
                              <Chip label={a.mode} size="small" />
                            </ListItem>
                            <Divider />
                          </React.Fragment>
                        ))}
                      </List>
                    </Box>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">Click refresh to load ledger.</Typography>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "chatbot" && (
            <Card sx={{ borderRadius: 4 }}>
              <CardContent sx={{ height: 400, display: "flex", flexDirection: "column" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", pb: 1, mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>Accessibility Assistant</Typography>
                  <Button size="small" startIcon={ttsEnabled ? <VolumeUp /> : <VolumeOff />} onClick={() => setTtsEnabled(!ttsEnabled)}>
                    TTS {ttsEnabled ? "On" : "Off"}
                  </Button>
                </Box>
                
                <Box sx={{ flexGrow: 1, overflowY: "auto", mb: 2, display: "flex", flexDirection: "column", gap: 1, p: 1, bgcolor: "#fdfdfd", border: "1px solid #ddd", borderRadius: 2 }}>
                  {chatMessages.map((msg, idx) => (
                    <Box key={idx} sx={{ 
                      alignSelf: msg.sender === "user" ? "flex-end" : "flex-start",
                      bgcolor: msg.sender === "user" ? "#006374" : "#e0f2f1",
                      color: msg.sender === "user" ? "#fff" : "#000",
                      p: 1.5,
                      borderRadius: 3,
                      maxWidth: "80%",
                      fontSize: 12,
                      whiteSpace: "pre-line"
                    }}>
                      {msg.text}
                    </Box>
                  ))}
                </Box>
                
                <Box component="form" onSubmit={sendChatMessage} sx={{ display: "flex", gap: 1 }}>
                  <TextField label="Type a command..." value={chatInput} onChange={e => setChatInput(e.target.value)} size="small" fullWidth />
                  <Button type="submit" variant="contained" sx={{ bgcolor: "#006374" }}>Send</Button>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
