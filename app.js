* { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, sans-serif; }

body {
  margin: 0;
  background: linear-gradient(180deg,#0f172a,#020617);
  color: #fff;
}

.container {
  padding: 16px;
  padding-bottom: 110px;
}

.card {
  background: rgba(255,255,255,0.08);
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 16px;
}

h1 { margin: 0 0 8px; }
small { opacity: .7; }

.input {
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: none;
  margin-top: 6px;
  margin-bottom: 12px;
}

.btn {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: #38bdf8;
  color: #000;
  font-weight: 700;
}

.btn.danger { background:#fb7185; }

.scanBox {
  height: 160px;
  background:#000;
  border-radius: 14px;
  overflow: hidden;
  margin-bottom: 12px;
}

.nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,.8);
  backdrop-filter: blur(10px);
  padding: 12px;
}

.navInner {
  display: flex;
  gap: 10px;
}

.navInner button {
  flex: 1;
  padding: 12px;
  border-radius: 14px;
  border: none;
  background: rgba(255,255,255,.15);
  color: #fff;
}

.navInner button.active {
  background: #38bdf8;
  color: #000;
}