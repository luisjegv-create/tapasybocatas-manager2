
// Simulation of a Payment Terminal Interface
// In a real-world scenario, this file would contain the WebSocket or HTTP calls
// to the local middleware (e.g., Paytef, Redsys, Stripe Terminal) provided by the bank.

export interface PaymentResult {
    success: boolean;
    transactionId?: string;
    message: string;
    authCode?: string;
}

export const connectToTerminal = async (): Promise<boolean> => {
    // Simulate handshake
    return new Promise((resolve) => {
        setTimeout(() => resolve(true), 1000);
    });
};

export const sendPaymentToTerminal = async (amount: number): Promise<PaymentResult> => {
    return new Promise((resolve, reject) => {
        console.log(`Sending ${amount} to payment terminal...`);
        
        // Simulating different stages of payment
        // 1. Sending amount
        // 2. Waiting for card
        // 3. Waiting for PIN
        // 4. Processing
        
        setTimeout(() => {
            // Simulate 95% success rate
            const isSuccess = Math.random() > 0.05; 
            
            if (isSuccess) {
                resolve({
                    success: true,
                    transactionId: Math.random().toString(36).substr(2, 12).toUpperCase(),
                    authCode: Math.floor(100000 + Math.random() * 900000).toString(),
                    message: 'Operación Aprobada'
                });
            } else {
                resolve({
                    success: false,
                    message: 'Operación Denegada / Error de lectura'
                });
            }
        }, 3000); // 3 seconds delay to simulate user entering PIN
    });
};
