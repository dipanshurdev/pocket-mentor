import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Type-only import: erased at runtime, so the web bundle never pulls in the
// native react-native-purchases module. The runtime fallback lives in
// services/revenuecat.ts (Platform.OS !== 'web' guard + sandbox mock).
import type { PurchasesPackage } from 'react-native-purchases';
import {
  setupPurchases,
  checkIsPro,
  fetchDefaultOffering,
  purchasePackage,
  restorePurchases,
} from './services/revenuecat';
import {
  SCENARIOS,
  Scenario,
  analyzeExecutiveResponse,
  EvaluationResult,
} from './constants/scenarios';
import { PaywallModal } from './components/PaywallModal';

interface SessionRecord {
  id: string;
  scenarioTitle: string;
  score: number;
  verdict: string;
  timestamp: string;
}

const HISTORY_KEY = '@pocketmentor_history';

export default function App() {
  const [isPro, setIsPro] = useState(false);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(
    SCENARIOS[0]
  );
  const [inputText, setInputText] = useState('');
  const [analysis, setAnalysis] = useState<EvaluationResult | null>(null);
  const [history, setHistory] = useState<SessionRecord[]>([]);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [loadingOfferings, setLoadingOfferings] = useState(false);
  const [monthlyPkg, setMonthlyPkg] = useState<PurchasesPackage | null>(null);
  const [lifetimePkg, setLifetimePkg] = useState<PurchasesPackage | null>(
    null
  );

  useEffect(() => {
    bootstrap();
  }, []);

  const bootstrap = async () => {
    await setupPurchases();
    const pro = await checkIsPro();
    setIsPro(pro);
    loadOfferings();
    loadStoredHistory();
  };

  const loadStoredHistory = async () => {
    try {
      const data = await AsyncStorage.getItem(HISTORY_KEY);
      if (data) setHistory(JSON.parse(data));
    } catch (e) {
      console.log('Error reading storage:', e);
    }
  };

  const saveHistoryRecord = async (newRecord: SessionRecord) => {
    try {
      const updated = [newRecord, ...history].slice(0, 5);
      setHistory(updated);
      await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log('Error saving history:', e);
    }
  };

  const loadOfferings = async () => {
    setLoadingOfferings(true);
    try {
      const offering = await fetchDefaultOffering();
      const pkgs = offering?.availablePackages;
      if (pkgs && pkgs.length > 0) {
        // Compare as strings: PACKAGE_TYPE is a string enum at runtime, and
        // importing it would pull native code into the web bundle.
        setMonthlyPkg(
          pkgs.find((p: PurchasesPackage) => String(p.packageType) === 'MONTHLY') ??
            pkgs[0]
        );
        setLifetimePkg(
          pkgs.find(
            (p: PurchasesPackage) =>
              String(p.packageType) === 'LIFETIME' ||
              String(p.packageType) === 'ANNUAL'
          ) ?? pkgs[1] ?? null
        );
      }
    } finally {
      setLoadingOfferings(false);
    }
  };

  const handleSelectScenario = (sc: Scenario) => {
    if (sc.isProOnly && !isPro) {
      setPaywallOpen(true);
      return;
    }
    setSelectedScenario(sc);
    setInputText('');
    setAnalysis(null);
  };

  const handleEvaluate = () => {
    if (!inputText.trim()) return;
    const res = analyzeExecutiveResponse(inputText, selectedScenario);
    setAnalysis(res);

    const record: SessionRecord = {
      id: Date.now().toString(),
      scenarioTitle: selectedScenario.title,
      score: res.score,
      verdict: res.verdict,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    saveHistoryRecord(record);
  };

  const handlePurchase = async (pkg: PurchasesPackage) => {
    const success = await purchasePackage(pkg);
    if (success) {
      setIsPro(true);
      setPaywallOpen(false);
      Alert.alert('Unlocked!', 'PocketMentor Pro access is now active.');
    }
  };

  const handleRestore = async () => {
    const success = await restorePurchases();
    if (success) {
      setIsPro(true);
      setPaywallOpen(false);
      Alert.alert('Restored!', 'Your Pro subscription has been verified.');
    } else {
      Alert.alert('Notice', 'No previous Pro purchases found.');
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={styles.appShell}
        edges={['top', 'bottom', 'left', 'right']}
      >
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={styles.mobileContainer}>
          {/* Top Navbar */}
          <View style={styles.navBar}>
            <View>
              <Text style={styles.brandTitle}>PocketMentor</Text>
              <Text style={styles.brandTagline}>
                AI Executive Communication Coach
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.badgePill,
                isPro ? styles.badgePro : styles.badgeFree,
              ]}
              onPress={() => !isPro && setPaywallOpen(true)}
            >
              <Text style={styles.badgePillText}>
                {isPro ? 'PRO PASS' : 'FREE TIER'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Horizontal Scenario Selector */}
          <Text style={styles.sectionHeader}>Select Practice Scenario</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.scenarioScroller}
            contentContainerStyle={styles.scenarioScrollerContent}
          >
            {SCENARIOS.map((item) => {
              const active = item.id === selectedScenario.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.scenarioCard,
                    active && styles.scenarioCardActive,
                  ]}
                  onPress={() => handleSelectScenario(item)}
                >
                  <Text
                    style={[
                      styles.scenarioTitle,
                      active && styles.scenarioTitleActive,
                    ]}
                  >
                    {item.title}
                  </Text>
                  {item.isProOnly && !isPro && (
                    <View style={styles.proLockPill}>
                      <Text style={styles.proLockText}>🔒 PRO</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Scenario Card */}
          <View style={styles.contextBox}>
            <Text style={styles.contextRole}>
              Counterpart: {selectedScenario.role}
            </Text>
            <Text style={styles.contextDesc}>{selectedScenario.context}</Text>
            <View style={styles.frameworkBox}>
              <Text style={styles.frameworkLabel}>Strategic Framework:</Text>
              <Text style={styles.frameworkText}>
                {selectedScenario.idealFramework}
              </Text>
            </View>
          </View>

          {/* Input Prompt Box */}
          <Text style={styles.sectionHeader}>Draft Your Response</Text>
          <TextInput
            style={styles.inputArea}
            placeholder="State boundaries, manage expectations, or propose alternatives..."
            placeholderTextColor="#64748b"
            multiline
            numberOfLines={4}
            value={inputText}
            onChangeText={setInputText}
          />

          <TouchableOpacity style={styles.evalBtn} onPress={handleEvaluate}>
            <Text style={styles.evalBtnText}>Run Executive Assessment</Text>
          </TouchableOpacity>

          {/* Multi-Dimensional Feedback Card */}
          {analysis && (
            <View style={styles.analysisContainer}>
              <View style={styles.analysisHeader}>
                <View>
                  <Text style={styles.verdictLabel}>{analysis.verdict}</Text>
                  <Text style={styles.summaryLabel}>
                    Communication Diagnostic
                  </Text>
                </View>
                <Text style={styles.scorePill}>{analysis.score}/100</Text>
              </View>

              {/* Sub-Metric Bars */}
              <View style={styles.metricsGrid}>
                <View style={[styles.metricItem, styles.metricItemLeft]}>
                  <Text style={styles.metricName}>Assertiveness</Text>
                  <Text style={styles.metricVal}>
                    {analysis.assertiveness}%
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricName}>Diplomacy</Text>
                  <Text style={styles.metricVal}>{analysis.diplomacy}%</Text>
                </View>
                <View style={[styles.metricItem, styles.metricItemRight]}>
                  <Text style={styles.metricName}>Clarity</Text>
                  <Text style={styles.metricVal}>{analysis.clarity}%</Text>
                </View>
              </View>

              <View style={styles.critiqueBox}>
                <Text style={styles.critiqueHeading}>Key Strength:</Text>
                <Text style={styles.critiqueText}>{analysis.strengths}</Text>
                <Text style={[styles.critiqueHeading, { marginTop: 8 }]}>
                  Actionable Blindspot:
                </Text>
                <Text style={styles.critiqueText}>{analysis.blindspot}</Text>
              </View>

              {/* Executive Rewrite Box */}
              <View style={styles.rewriteBox}>
                <Text style={styles.rewriteHeader}>
                  ✨ Staff-Level Alternative Script:
                </Text>
                <Text style={styles.rewriteBody}>
                  &quot;{analysis.executiveRewrite}&quot;
                </Text>
              </View>
            </View>
          )}

          {/* Persistence Section */}
          {history.length > 0 && (
            <View style={styles.historySection}>
              <Text style={styles.sectionHeader}>Session Progress Log</Text>
              {history.map((h) => (
                <View key={h.id} style={styles.historyRow}>
                  <View>
                    <Text style={styles.historyTitle}>
                      {h.scenarioTitle}
                    </Text>
                    <Text style={styles.historyMeta}>
                      {h.verdict} • {h.timestamp}
                    </Text>
                  </View>
                  <Text style={styles.historyScore}>{h.score} pts</Text>
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Paywall */}
        <PaywallModal
          visible={paywallOpen}
          onClose={() => setPaywallOpen(false)}
          monthlyPkg={monthlyPkg}
          lifetimePkg={lifetimePkg}
          onSelectPackage={handlePurchase}
          onRestore={handleRestore}
          loading={loadingOfferings}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: '#030712',
  },
  mobileContainer: {
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeFree: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgePro: {
    backgroundColor: '#0284c7',
  },
  badgePillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 10,
  },
  scenarioScroller: {
    flexGrow: 0,
    marginBottom: 16,
  },
  scenarioScrollerContent: {
    flexDirection: 'row',
    paddingRight: 20,
  },
  scenarioCard: {
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    width: 220,
  },
  scenarioCardActive: {
    borderColor: '#0284c7',
    backgroundColor: '#081f38',
  },
  scenarioTitle: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  scenarioTitleActive: {
    color: '#f8fafc',
  },
  proLockPill: {
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proLockText: {
    color: '#fbbf24',
    fontSize: 10,
    fontWeight: '800',
  },
  contextBox: {
    backgroundColor: '#0b1329',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 18,
  },
  contextRole: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  contextDesc: {
    color: '#e2e8f0',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  frameworkBox: {
    backgroundColor: '#040d1a',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0c4a6e',
  },
  frameworkLabel: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
  },
  frameworkText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  inputArea: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    color: '#f8fafc',
    padding: 16,
    fontSize: 14,
    minHeight: 110,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  evalBtn: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  evalBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  analysisContainer: {
    backgroundColor: '#0b1329',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1e3a5f',
    marginBottom: 20,
  },
  analysisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  verdictLabel: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: 11,
  },
  scorePill: {
    color: '#38bdf8',
    fontSize: 20,
    fontWeight: '900',
  },
  metricsGrid: {
    flexDirection: 'row',
    marginBottom: 14,
    marginHorizontal: -4,
  },
  metricItem: {
    flex: 1,
    backgroundColor: '#081426',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  metricItemLeft: {},
  metricItemRight: {},
  metricName: {
    color: '#94a3b8',
    fontSize: 11,
  },
  metricVal: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  critiqueBox: {
    backgroundColor: '#081426',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  critiqueHeading: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
  },
  critiqueText: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
  rewriteBox: {
    backgroundColor: '#0c2242',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#38bdf8',
  },
  rewriteHeader: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  rewriteBody: {
    color: '#e0f2fe',
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  historySection: {
    marginTop: 10,
  },
  historyRow: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  historyTitle: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
  },
  historyMeta: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  historyScore: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '800',
  },
});
