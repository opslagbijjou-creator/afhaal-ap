function renderModerator(user){
  app.innerHTML=`
    <div class="card">
      <h1>Welkom ${user.username}</h1>
      <p>Moderator</p>
      <button onclick="alert('Inscannen komt hier')">📦 Inscannen</button><br/><br/>
      <button onclick="alert('Afgeven komt hier')">✅ Afgeven</button><br/><br/>
      <button onclick="alert('Beheer komt hier')">🛠️ Beheer</button>
      <div class="small" onclick="logout()">Uitloggen</div>
    </div>`;
}
