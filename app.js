const app = Vue.createApp({
  data() {
    return {
      map: null,
      pins: [],
      // Use a localhost URL for testing to avoid DNS errors
      workerUrl: window.location.protocol.startsWith('file')
        ? 'http://localhost:8787'
        : 'https://map-pins-worker.your-worker-subdomain.workers.dev',
      showChat: false,
      selectedPin: null,
      newMessage: ''
    };
  },
  mounted() {
    this.initMap();
    this.loadPins();
  },
  methods: {
    initMap() {
      this.map = L.map('map').setView([51.505, -0.09], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(this.map);
      this.map.on('click', this.addPin);
    },
    async validatePin(pin) {
      const response = await fetch(`${this.workerUrl}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pin)
      });
      return response.ok;
    },
    async addPin(e) {
      const newPin = {
        id: crypto.randomUUID(),
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        messages: []
      };

      const isValid = await this.validatePin(newPin);
      if (isValid) {
        this.pins.push(newPin);
        const marker = L.marker([newPin.lat, newPin.lng]).addTo(this.map);
        marker.on('click', () => this.openChat(newPin));
        await this.savePin(newPin);
      } else {
        alert('Pin validation failed!');
      }
    },
    async savePin(pin) {
      await fetch(this.workerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pin)
      });
    },
    async loadPins() {
        const response = await fetch(this.workerUrl);
        this.pins = await response.json();
        this.pins.forEach(pin => {
            const marker = L.marker([pin.lat, pin.lng]).addTo(this.map);
            marker.on('click', () => this.openChat(pin));
        });
    },
    openChat(pin) {
        this.selectedPin = pin;
        this.showChat = true;
    },
    async sendMessage() {
        if (this.newMessage.trim() === '') return;

        const message = {
            id: crypto.randomUUID(),
            text: this.newMessage
        };

        if (!this.selectedPin.messages) {
            this.selectedPin.messages = [];
        }
        this.selectedPin.messages.push(message);

        await fetch(`${this.workerUrl}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pinId: this.selectedPin.id, message })
        });

        this.newMessage = '';
    }
  }
});

app.mount('#app');
