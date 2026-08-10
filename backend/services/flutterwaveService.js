// PoleSafe — Flutterwave Payment Service
// Real payment processing: MTN Momo, Airtel Money, Card, Bank Transfer
// Replace the demo service when going live

const config = require('../config');
const { Transaction, Credit, User } = require('../database/schema');

class FlutterwaveService {

  constructor() {
    this.baseUrl = 'https://api.flutterwave.com/v3';
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY || config.FLUTTERWAVE.SECRET_KEY;
    this.isLive = process.env.FLUTTERWAVE_LIVE === 'true';
  }

  get headers() {
    return {
      'Authorization': `Bearer ${this.secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Charge a Mobile Money wallet (MTN / Airtel Uganda)
   */
  async chargeMobileMoney({ phone, amount, currency = 'UGX', provider, narration, userId }) {
    const payload = {
      tx_ref: `PS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      amount,
      currency,
      phone_number: phone.startsWith('+') ? phone.slice(1) : phone,
      network: provider === 'mtn' ? 'MTN' : 'AIRTEL',
      email: 'payment@polesafe.ug',
      fullname: narration || 'PoleSafe Payment',
      is_permanent: false,
    };

    try {
      const https = require('https');
      const response = await this._request('POST', '/charges?type=mobile_money_uganda', payload);

      if (response.status === 'success') {
        // For Momo, Flutterwave returns a flw_ref to check status
        const transaction = await Transaction.create({
          parentId: userId,
          type: 'booking_payment',
          amount,
          currency,
          method: 'mobile_money',
          provider,
          status: 'pending',
          reference: payload.tx_ref,
          flwRef: response.data?.flw_ref || '',
          flutterwaveResponse: JSON.stringify(response),
          isBatched: false,
        });

        // Momo requires PIN verification — return the ref for the frontend
        return {
          success: true,
          requiresPin: true,
          flwRef: response.data?.flw_ref,
          txRef: payload.tx_ref,
          transaction,
          message: 'Check your phone to enter Momo PIN',
        };
      }

      throw new Error(response.message || 'Mobile money charge failed');
    } catch (err) {
      console.error('[Flutterwave] Momo charge failed:', err.message);
      throw err;
    }
  }

  /**
   * Verify a Momo payment after user enters PIN
   * Frontend calls this with the flw_ref from chargeMobileMoney
   */
  async verifyMobileMoney(flwRef) {
    try {
      const response = await this._request('GET', `/transactions/${flwRef}/verify`);

      if (response.status === 'success' && response.data.status === 'successful') {
        await Transaction.findOneAndUpdate(
          { flwRef },
          { status: 'completed', flutterwaveResponse: JSON.stringify(response) }
        );
        return { success: true, transaction: response.data };
      }

      return { success: false, status: response.data?.status || 'failed' };
    } catch (err) {
      console.error('[Flutterwave] Verification failed:', err.message);
      throw err;
    }
  }

  /**
   * Charge a debit/credit card
   */
  async chargeCard({ cardDetails, amount, currency = 'UGX', userId, narration }) {
    const payload = {
      tx_ref: `PS-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      amount,
      currency,
      card_number: cardDetails.number,
      cvv: cardDetails.cvv,
      expiry_month: cardDetails.expiryMonth,
      expiry_year: cardDetails.expiryYear,
      email: 'payment@polesafe.ug',
      fullname: narration || 'PoleSafe Payment',
    };

    try {
      const response = await this._request('POST', '/charges?type=card', payload);

      if (response.status === 'success') {
        const transaction = await Transaction.create({
          parentId: userId,
          type: 'booking_payment',
          amount,
          currency,
          method: 'card',
          provider: 'flutterwave',
          status: response.data?.status === 'successful' ? 'completed' : 'pending',
          reference: payload.tx_ref,
          flutterwaveResponse: JSON.stringify(response),
          isBatched: false,
        });

        return {
          success: true,
          transaction,
          requiresAuth: response.meta?.authorization?.mode === 'avs_noauth',
          authUrl: response.meta?.authorization?.redirect || null,
        };
      }

      throw new Error(response.message || 'Card charge failed');
    } catch (err) {
      console.error('[Flutterwave] Card charge failed:', err.message);
      throw err;
    }
  }

  /**
   * Initiate a bank transfer (for batch settlements to drivers)
   */
  async initiateTransfer({ amount, currency = 'UGX', recipient, narration, driverId }) {
    const payload = {
      account_bank: recipient.bankCode,
      account_number: recipient.accountNumber,
      amount,
      currency,
      narration: narration || `PoleSafe Driver Settlement`,
      reference: `PS-STL-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      debit_currency: 'UGX',
    };

    try {
      const response = await this._request('POST', '/transfers', payload);

      if (response.status === 'success') {
        await Transaction.create({
          parentId: driverId,
          type: 'driver_settlement',
          amount,
          currency,
          method: 'bank_transfer',
          provider: 'flutterwave',
          status: 'completed',
          reference: payload.reference,
          flutterwaveResponse: JSON.stringify(response),
          isBatched: true,
        });

        return { success: true, reference: payload.reference, transferId: response.data?.id };
      }

      throw new Error(response.message || 'Transfer failed');
    } catch (err) {
      console.error('[Flutterwave] Transfer failed:', err.message);
      throw err;
    }
  }

  /**
   * Batch settle multiple drivers at once
   * Called weekly to save on transaction fees
   */
  async batchSettleDrivers(settlements) {
    // Flutterwave supports bulk transfers
    const payload = {
      title: `PoleSafe Weekly Settlement ${new Date().toISOString().slice(0, 10)}`,
      bulk_data: settlements.map(s => ({
        bank_code: s.bankCode,
        account_number: s.accountNumber,
        amount: s.amount,
        currency: 'UGX',
        narration: `PoleSafe Driver Settlement — ${s.driverName}`,
        reference: `PS-BSTL-${Date.now()}-${s.driverId}`,
      })),
    };

    try {
      const response = await this._request('POST', '/bulk-transfers', payload);
      return {
        success: response.status === 'success',
        batchId: response.data?.id,
        totalAmount: settlements.reduce((sum, s) => sum + s.amount, 0),
        driverCount: settlements.length,
      };
    } catch (err) {
      console.error('[Flutterwave] Batch settlement failed:', err.message);
      throw err;
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(currency = 'UGX') {
    try {
      const response = await this._request('GET', '/balances');
      const balance = response.data?.find(b => b.currency === currency);
      return balance ? { currency: balance.currency, available: balance.available_balance } : null;
    } catch (err) {
      console.error('[Flutterwave] Balance check failed:', err.message);
      throw err;
    }
  }

  /**
   * List banks in Uganda (for driver settlement setup)
   */
  async listBanks() {
    try {
      const response = await this._request('GET', '/banks/UG');
      return response.data?.map(b => ({
        code: b.code,
        name: b.name,
      })) || [];
    } catch (err) {
      console.error('[Flutterwave] Bank list failed:', err.message);
      throw err;
    }
  }

  // ============================================================
  // INTERNAL
  // ============================================================

  _request(method, path, body) {
    return new Promise((resolve, reject) => {
      const https = require('https');
      const url = new URL(path, this.baseUrl);

      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method,
        headers: this.headers,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error('Invalid Flutterwave response'));
          }
        });
      });

      req.on('error', reject);

      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }
}

module.exports = new FlutterwaveService();
