const app = Vue.createApp({
  data() {
    return {
      map: null,
      pins: [],
      workerUrl: 'https://your-worker-url.workers.dev' // Replace with your worker URL
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
    async addPin(e) {
      const newPin = {
        lat: e.latlng.lat,
        lng: e.latlng.lng
      };
      this.pins.push(newPin);
      L.marker([newPin.lat, newPin.lng]).addTo(this.map);
      await this.savePin(newPin);
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
        L.marker([pin.lat, pin.lng]).addTo(this.map);
      });
    }
  }
});

app.mount('#app');
