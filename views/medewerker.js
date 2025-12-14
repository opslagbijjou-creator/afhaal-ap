function renderMedewerker(user){
  app.innerHTML=`
    <div class="card">
      <h1>Welkom ${user.username}</h1>
      <p>Medewerker</p>
      <button onclick="renderInscannen()">📦 Inscannen</button><br/><br/>
      <button onclick="alert('Afgeven komt hier')">✅ Afgeven</button>
      <div class="small" onclick="logout()">Uitloggen</div>
    </div>`;
}
