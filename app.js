(() => {
  const C = window.SUSHI_CONFIG;
  const PRODUCTS = window.SUSHI_PRODUCTS;
  const CATEGORIES = window.SUSHI_CATEGORIES;
  let cart = JSON.parse(localStorage.getItem("kuro-cart") || "[]");
  let query = "";
  let activeCategory = "Todos";

  const $ = s => document.querySelector(s);
  const money = v => new Intl.NumberFormat(C.restaurant.locale,{style:"currency",currency:C.restaurant.currency}).format(v);
  const el = {
    name: $("#restaurantName"), short: $("#restaurantShort"), tagline: $("#tagline"),
    categories: $("#categories"), menu: $("#menuContent"), popular: $("#popularGrid"),
    cartCount: $("#cartCount"), cartPanel: $("#cartPanel"), backdrop: $("#backdrop"),
    cartItems: $("#cartItems"), cartTotal: $("#cartTotal"), checkout: $("#checkoutModal"),
    address: $("#addressField"), toast: $("#toast"), search: $("#searchInput"), year: $("#year")
  };

  document.documentElement.style.setProperty("--accent", C.theme.accent);
  document.documentElement.style.setProperty("--gold", C.theme.gold);
  document.documentElement.style.setProperty("--bg", C.theme.background);
  document.documentElement.style.setProperty("--surface", C.theme.surface);
  document.documentElement.style.setProperty("--text", C.theme.text);
  el.name.textContent = C.restaurant.name;
  el.short.textContent = C.restaurant.shortName;
  el.tagline.textContent = C.restaurant.tagline;
  el.year.textContent = new Date().getFullYear();

  const toast = msg => {
    el.toast.textContent = msg; el.toast.classList.add("show");
    clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.toast.classList.remove("show"),1600);
  };
  const save = () => localStorage.setItem("kuro-cart",JSON.stringify(cart));

  function renderCategories(){
    el.categories.innerHTML = ["Todos",...CATEGORIES].map(c=>`<button class="cat-btn ${activeCategory===c?"active":""}" data-cat="${c}">${c}</button>`).join("");
  }

  function productCard(p){
    return `<article class="product">
      <img src="${p.image}" alt="${p.name}" loading="lazy">
      <div><h4>${p.name}</h4><p>${p.description}</p></div>
      <div class="product-action"><div class="product-price">${money(p.price)}</div><button class="add-btn" data-add="${p.id}" aria-label="Adicionar ${p.name}">+</button></div>
    </article>`;
  }

  function renderMenu(){
    const q = query.trim().toLowerCase();
    const filtered = PRODUCTS.filter(p => (activeCategory==="Todos" || p.category===activeCategory) && (!q || (p.name+" "+p.description+" "+p.category).toLowerCase().includes(q)));
    if(!filtered.length){ el.menu.innerHTML='<div class="empty-state">Nenhum item encontrado.</div>'; return; }
    const groups = (activeCategory==="Todos" ? CATEGORIES : [activeCategory]).map(cat => {
      const items = filtered.filter(p=>p.category===cat);
      if(!items.length) return "";
      return `<section class="menu-group" id="cat-${cat.replace(/\s/g,"-")}"><div class="menu-group-title"><h3>${cat}</h3></div><div class="menu-grid">${items.map(productCard).join("")}</div></section>`;
    }).join("");
    el.menu.innerHTML = groups;
  }

  function renderPopular(){
    el.popular.innerHTML = PRODUCTS.filter(p=>p.popular).slice(0,4).map(p=>`<article class="popular-card" data-add="${p.id}" role="button" tabindex="0"><img src="${p.image}" alt="${p.name}" loading="lazy"><div class="popular-info"><strong>${p.name}</strong><span>${money(p.price)}</span></div></article>`).join("");
  }

  function renderFeatured(){
    const p=PRODUCTS.find(p=>p.featured)||PRODUCTS[0];
    $("#featuredImage").src=p.image; $("#featuredName").textContent=p.name; $("#featuredDescription").textContent=p.description; $("#featuredPrice").textContent=money(p.price); $("#featuredAdd").dataset.add=p.id;
  }

  function add(id){
    const found = cart.find(i=>i.id===id);
    if(found) found.qty++; else { const p=PRODUCTS.find(p=>p.id===id); cart.push({id:p.id,name:p.name,price:p.price,image:p.image,qty:1}); }
    save(); renderCart(); toast("Adicionado ao pedido");
  }
  function change(id,delta){
    const item=cart.find(i=>i.id===id); if(!item) return; item.qty+=delta;
    if(item.qty<=0) cart=cart.filter(i=>i.id!==id); save(); renderCart();
  }
  function remove(id){ cart=cart.filter(i=>i.id!==id); save(); renderCart(); }
  function renderCart(){
    const count=cart.reduce((s,i)=>s+i.qty,0), total=cart.reduce((s,i)=>s+i.qty*i.price,0);
    el.cartCount.textContent=count; el.cartTotal.textContent=money(total);
    el.cartItems.innerHTML = cart.length ? cart.map(i=>`<div class="cart-item"><img src="${i.image}" alt=""><div><div class="cart-row"><strong>${i.name}</strong><span>${money(i.price*i.qty)}</span></div><div class="qty"><button data-qty="-1" data-id="${i.id}">−</button><span>${i.qty}</span><button data-qty="1" data-id="${i.id}">+</button><button class="remove" data-remove="${i.id}">Remover</button></div></div></div>`).join("") : '<div class="cart-empty">Seu carrinho ainda está vazio.<br>Escolha algo especial no cardápio.</div>';
    $("#checkoutBtn").disabled=!cart.length; $("#checkoutBtn").style.opacity=cart.length?1:.45;
  }

  const openCart=()=>{el.cartPanel.classList.add("active");el.backdrop.classList.add("active");document.body.style.overflow="hidden"};
  const closeLayers=()=>{el.cartPanel.classList.remove("active");el.checkout.classList.remove("active");el.backdrop.classList.remove("active");document.body.style.overflow=""};

  document.addEventListener("click", e=>{
    const addBtn=e.target.closest("[data-add]"); if(addBtn){add(Number(addBtn.dataset.add));return}
    const cat=e.target.closest("[data-cat]"); if(cat){activeCategory=cat.dataset.cat;renderCategories();renderMenu();if(activeCategory!=="Todos") setTimeout(()=>$("#menu").scrollIntoView({behavior:"smooth"}),10);return}
    const qty=e.target.closest("[data-qty]"); if(qty){change(Number(qty.dataset.id),Number(qty.dataset.qty));return}
    const rem=e.target.closest("[data-remove]"); if(rem){remove(Number(rem.dataset.remove));return}
  });
  $("#cartTrigger").onclick=openCart; $("#closeCart").onclick=closeLayers; el.backdrop.onclick=closeLayers;
  $("#browseBtn").onclick=()=>$("#menu").scrollIntoView({behavior:"smooth"});
  el.search.addEventListener("input",e=>{query=e.target.value;renderMenu()});
  $("#checkoutBtn").onclick=()=>{if(!cart.length)return;el.cartPanel.classList.remove("active");el.checkout.classList.add("active")};
  $("#closeCheckout").onclick=closeLayers; $("#backToCart").onclick=()=>{el.checkout.classList.remove("active");el.cartPanel.classList.add("active")};

  document.querySelectorAll('input[name="orderType"]').forEach(r=>r.addEventListener("change",()=>{
    const isDelivery=document.querySelector('input[name="orderType"]:checked').value==="Entrega";
    el.address.classList.toggle("hidden",!isDelivery); $("#address").required=isDelivery;
  }));

  $("#checkoutForm").addEventListener("submit",e=>{
    e.preventDefault();
    if(!cart.length) return;
    const f=new FormData(e.currentTarget), type=f.get("orderType"), total=cart.reduce((s,i)=>s+i.qty*i.price,0);
    const lines=[
      `🍣 *Novo pedido — ${C.restaurant.name}*`,"",
      ...cart.map(i=>`• ${i.qty}x ${i.name} — ${money(i.qty*i.price)}`),"",
      `*Total:* ${money(total)}`,"",
      `*Cliente:* ${f.get("name")}`,
      `*Telefone:* ${f.get("phone")}`,
      `*Tipo:* ${type}`,
      type==="Entrega" ? `*Endereço:* ${f.get("address")}` : null,
      `*Pagamento:* ${f.get("payment")}`,
      f.get("notes") ? `*Observações:* ${f.get("notes")}` : null
    ].filter(Boolean);
    const url=`https://wa.me/${C.restaurant.whatsapp}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url,"_blank","noopener,noreferrer");
  });

  renderCategories(); renderPopular(); renderFeatured(); renderMenu(); renderCart();
})();