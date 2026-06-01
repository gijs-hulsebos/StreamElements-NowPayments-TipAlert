// Code to paste into the JS tab of the StreamElements Custom Widget

window.addEventListener('onWidgetLoad', function (obj) {
    // 1. Get Pusher keys from the widget fields or hardcode them
    const PUSHER_KEY = 'YOUR_PUSHER_KEY';
    const PUSHER_CLUSTER = 'YOUR_PUSHER_CLUSTER';

    if (!PUSHER_KEY || PUSHER_KEY === 'YOUR_PUSHER_KEY') {
        console.error('Please configure your Pusher App Key in the widget code.');
        return;
    }

    // 2. Load Pusher Script Dynamically
    const script = document.createElement('script');
    script.src = 'https://js.pusher.com/8.0/pusher.min.js';
    script.onload = () => {
        // 3. Initialize Pusher once loaded
        const pusher = new Pusher(PUSHER_KEY, {
            cluster: PUSHER_CLUSTER
        });

        // 4. Subscribe to the channel your Next.js webhook broadcasts to
        const channel = pusher.subscribe('stream-alerts');

        // 5. Bind to the donation event
        channel.bind('donation-received', function(data) {
            console.log('Donation received from Pusher:', data);
            
            // You can dispatch a standard SE event or build raw HTML inside this widget!
            // E.g., showing the name and amount on the screen
            const container = document.getElementById('alert-container');
            if (container) {
                container.innerHTML = `<h1>New Tip from ${data.order_description}: ${data.price_amount} ${data.price_currency}</h1>`;
                
                // Hide it after 5 seconds
                setTimeout(() => {
                    container.innerHTML = '';
                }, 5000);
            }
        });
    };
    
    document.head.appendChild(script);
});
