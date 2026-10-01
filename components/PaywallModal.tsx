import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
// Type-only import: erased at runtime, so the web bundle never pulls in the
// native react-native-purchases module. Safe for Expo Go + web.
import type { PurchasesPackage } from 'react-native-purchases';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
  monthlyPkg: PurchasesPackage | null;
  lifetimePkg: PurchasesPackage | null;
  onSelectPackage: (pkg: PurchasesPackage) => void;
  onRestore: () => void;
  loading: boolean;
}

export const PaywallModal = ({
  visible,
  onClose,
  monthlyPkg,
  lifetimePkg,
  onSelectPackage,
  onRestore,
  loading,
}: PaywallProps) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'lifetime'>(
    'monthly'
  );

  const activePkg = selectedPlan === 'monthly' ? monthlyPkg : lifetimePkg;
  const monthlyPrice = monthlyPkg?.product?.priceString ?? '$4.99';
  const lifetimePrice = lifetimePkg?.product?.priceString ?? '$29.99';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.dragBar} />

          <View style={styles.pillBadge}>
            <Text style={styles.pillText}>REVENUECAT POWERED ACCESS</Text>
          </View>

          <Text style={styles.heading}>Unlock Executive Communication</Text>
          <Text style={styles.subtext}>
            Master high-friction workplace conversations with structured
            feedback, metrics, and leadership scripts.
          </Text>

          {/* Feature List */}
          <View style={styles.featureBox}>
            <Text style={styles.featureRow}>
              ⚡{' '}
              <Text style={styles.featureBold}>Full Scenario Suite:</Text>{' '}
              Upward feedback, tech debt, and scope creep.
            </Text>
            <Text style={[styles.featureRow, styles.featureRowSpaced]}>
              🎯{' '}
              <Text style={styles.featureBold}>Multi-Metric Scoring:</Text>{' '}
              Deep diagnostics on Assertiveness, Diplomacy, & Clarity.
            </Text>
            <Text style={[styles.featureRow, styles.featureRowSpaced]}>
              ✨{' '}
              <Text style={styles.featureBold}>Staff-Level Rewrites:</Text>{' '}
              Instant alternative scripts for every response.
            </Text>
          </View>

          {/* Tier Cards */}
          <View style={styles.tiersContainer}>
            <TouchableOpacity
              style={[
                styles.tierCard,
                selectedPlan === 'monthly' && styles.tierCardActive,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <Text style={styles.tierTitle}>Monthly Pro</Text>
              <Text style={styles.tierPrice}>{monthlyPrice} / mo</Text>
              <Text style={styles.tierMeta}>
                Flexible monthly cancellation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tierCard,
                selectedPlan === 'lifetime' && styles.tierCardActive,
              ]}
              onPress={() => setSelectedPlan('lifetime')}
            >
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>SAVE 65%</Text>
              </View>
              <Text style={styles.tierTitle}>Lifetime Pass</Text>
              <Text style={styles.tierPrice}>{lifetimePrice} once</Text>
              <Text style={styles.tierMeta}>
                Permanent access to all future modules
              </Text>
            </TouchableOpacity>
          </View>

          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => activePkg && onSelectPackage(activePkg)}
            disabled={loading || !activePkg}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.ctaText}>
                Unlock{' '}
                {selectedPlan === 'monthly'
                  ? `Monthly Access (${monthlyPrice})`
                  : `Lifetime Access (${lifetimePrice})`}
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore & Close */}
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={onRestore}>
              <Text style={styles.footerLinkText}>Restore Purchases</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>•</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.footerLinkText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.82)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0b1329',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  dragBar: {
    width: 44,
    height: 5,
    backgroundColor: '#334155',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  pillBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#0369a1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 10,
  },
  pillText: {
    color: '#e0f2fe',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
  },
  subtext: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 19,
    marginBottom: 18,
  },
  featureBox: {
    backgroundColor: '#111e38',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e3a5f',
  },
  featureRow: {
    color: '#cbd5e1',
    fontSize: 13,
    lineHeight: 18,
  },
  featureRowSpaced: {
    marginTop: 8,
  },
  featureBold: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  tiersContainer: {
    flexDirection: 'row',
    marginBottom: 18,
    marginHorizontal: -6,
  },
  tierCard: {
    flex: 1,
    backgroundColor: '#111a2e',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: '#1e293b',
    position: 'relative',
    marginHorizontal: 6,
  },
  tierCardActive: {
    borderColor: '#38bdf8',
    backgroundColor: '#0c2242',
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: 8,
    backgroundColor: '#0284c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  saveBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  tierTitle: {
    color: '#f1f5f9',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  tierPrice: {
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  tierMeta: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 14,
  },
  ctaButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerLinkText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  footerDot: {
    color: '#475569',
    marginHorizontal: 10,
  },
});
