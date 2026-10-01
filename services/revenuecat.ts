import { Platform } from 'react-native';

let Purchases: any = null;
if (Platform.OS !== 'web') {
  try {
    Purchases = require('react-native-purchases').default;
  } catch (e) {
    console.log('Running in sandbox web/mock mode');
  }
}

const API_KEY = process.env.EXPO_PUBLIC_RC_API_KEY; // Your Test Store API key

let mockProStatus = false;

export const setupPurchases = async (): Promise<void> => {
  if (Purchases && Platform.OS !== 'web') {
    try {
      await Purchases.configure({ apiKey: API_KEY });
    } catch (e) {
      console.warn('RevenueCat native config failed:', e);
    }
  }
};

export const checkIsPro = async (): Promise<boolean> => {
  if (Purchases && Platform.OS !== 'web') {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.entitlements.active['pro'] !== undefined;
    } catch {
      return mockProStatus;
    }
  }
  return mockProStatus;
};

export const fetchDefaultOffering = async (): Promise<any> => {
  if (Purchases && Platform.OS !== 'web') {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current) return offerings.current;
    } catch (e) {
      console.warn('Error fetching offerings:', e);
    }
  }

  // Fallback offering data matching your Test Store setup
  return {
    availablePackages: [
      {
        identifier: '$rc_monthly',
        packageType: 'MONTHLY',
        product: {
          title: 'PocketMentor Pro Monthly',
          priceString: '$4.99',
          identifier: 'pocketmentor_pro_monthly',
        },
      },
      {
        identifier: '$rc_lifetime',
        packageType: 'LIFETIME',
        product: {
          title: 'PocketMentor Lifetime Access',
          priceString: '$29.99',
          identifier: 'pocketmentor_pro_lifetime',
        },
      },
    ],
  };
};

export const purchasePackage = async (pkg: any): Promise<boolean> => {
  if (Purchases && Platform.OS !== 'web') {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      return customerInfo.entitlements.active['pro'] !== undefined;
    } catch (err) {
      console.warn('Native purchase error, falling back to sandbox unlock:', err);
    }
  }
  // Sandbox test simulator: instantly grant pro
  mockProStatus = true;
  return true;
};

export const restorePurchases = async (): Promise<boolean> => {
  mockProStatus = true;
  return true;
};