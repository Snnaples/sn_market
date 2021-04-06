let { VrpProxy, VrpTunnel } = require('@vrpjs/server');
const vRP = VrpProxy.getInterface('vRP');
const sn = require("snUtils");


// SQL il bagati in phpmyadmin

/* 

CREATE TABLE `sn_market` (
    `ownerId` int(11) NOT NULL,
    `ownerName` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
    `itemName` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
    `itemAmount` int(11) NOT NULL,
    `itemPrice` int(11) NOT NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
  COMMIT;

*/  

function putItemIntoSale(source,name,amountOf) { 
    let ownerId = sn.getUserId(source);
    let ownerName = GetPlayerName(source);
   vRP.prompt(source,"Cantitate: ","", (...amount) => {
        let itemAmount = amount[1];
        if(itemAmount == null || itemAmount == "") return;
        if(itemAmount > amountOf) return;
        vRP.prompt(source,"Pret: ","", (...price) => {
           let itemPrice = price[1];
           if(itemPrice == null || itemPrice == "") return;
            if(itemPrice > 100000000 || itemPrice < 0)  return;
           exports.ghmattimysql.execute("INSERT INTO sn_market(ownerId,ownerName,itemName,itemAmount,itemPrice) VALUES(@ownerId,@ownerName,@item,@itemAmount,@itemPrice)",{
                ownerId : ownerId,
                ownerName : ownerName,
                item : name,
                itemAmount : itemAmount,
                itemPrice :  itemPrice
           });
           sn.notify(source,`Ti-ai pus itemul ~g~${vRP.getItemName(name)[0]}~w~ la vanzare!\n~g~Pret:~w~ ${itemPrice}\n~g~Cantitate:~w~ ${itemAmount}`);
           vRP.tryGetInventoryItem(ownerId,name,parseInt(itemAmount),false);
        });
   });
}

function sellItemsMenu(player,choice) {
    let user_id = sn.getUserId(player);
    let itemsList =  {name:"Inventarul tau",css : {top:"75px",header_color:"rgba(0,125,255,0.75)"}};
    let value = vRP.getUserDataTable(user_id)[0];
    
         console.log(JSON.stringify(value));
        for (let inventoryItem in value.inventory) {
            let itemName = vRP.getItemName(inventoryItem)[0];
           
            itemsList[`${itemName} [${value.inventory[inventoryItem].amount}]`] = [() => putItemIntoSale(player,inventoryItem,value.inventory[inventoryItem].amount)];
        }
        vRP.openMenu(player,itemsList);
   
    itemsList.onclose = () => vRP.openMenu(player,mainMenu);
}

function buyItem(source,item,i) {
    let user_id = sn.getUserId(source);
    let sellerName = item[i].ownerName;
    let sellerId = item[i].ownerId;
    let sellerSource = sn.getUserSource(sellerId);
    vRP.prompt(source,"Cantitate:","", (...cant) => {
        let itemCantitate = cant[1];
        if(itemCantitate < 0 || itemCantitate > 1500 || itemCantitate == null || itemCantitate == "") return;
        if(!sn.canAfford(user_id,item[i].itemPrice*itemCantitate)) return;
        if(sellerSource == null) {
            exports.ghmattimysql.execute("UPDATE `vrp_users` SET bankMoney = bankMoney + @bank WHERE id = @id", {bank : item.itemPrice, id : sellerId});
            exports.ghmattimysql.execute("DELETE FROM `sn_market` WHERE ownerId = @user_id", {user_id : sellerId});
            vRP.giveInventoryItem(user_id,item[i].itemName,parseInt(itemCantitate),false);
            sn.notify(source,`Ai cumparat ${itemCantitate} ~g~${vRP.getItemName(item[i].itemName)}`);
        }
        if(sellerSource != null) {
            vRP.giveMoney(sellerId,item[i].itemPrice*itemCantitate);
            sn.sendChatMessage(`Jucatorul ^2${GetPlayerName(source)}^0 ti-a cumparat ${vRP.getItemName(item[i].itemName)}\n^2Pret bucata: ^0${item[i].itemPrice}\n^2Cantitate:^0 ${itemCantitate}`,sellerSource);
            exports.ghmattimysql.execute("DELETE FROM `sn_market` WHERE ownerId = @user_id", {user_id : sellerId});
            sn.notify(source,`Ai cumparat ${itemCantitate} ~g~${vRP.getItemName(item[i].itemName)}`);
            vRP.giveInventoryItem(user_id,item[i].itemName,parseInt(itemCantitate),false);
            vRP.closeMenu(source,mainMenu);
        }
    });
}

function listedItems(player,choice) {
    let listedItems = {name:"Lista Iteme",css : {top:"75px",header_color:"rgba(0,125,255,0.75)"}};
    exports.ghmattimysql.execute("SELECT ownerId,ownerName,itemName,itemAmount,itemPrice FROM sn_market", (rows) => {
       
        for(let i = 0; i < rows.length; i++) {
            listedItems[`${vRP.getItemName(rows[i].itemName)[0]} [${rows[i].itemAmount}]`] = [() => buyItem(player,rows,i),`<font color='green'>Pret bucata:</font> ${rows[i].itemPrice}<br><font color='green'>Vanzator:</font> ${rows[i].ownerName}<br>`]
        }
        vRP.openMenu(player,listedItems);
    }); 
    listedItems.onclose = () => vRP.openMenu(player,mainMenu);
}

let mainMenu = {name:"mainMenu",css : {top:"75px",header_color:"rgba(0,125,255,0.75)"}};
mainMenu["Pune iteme la vanzare"] = [(player,choice) => sellItemsMenu(player,choice)];
mainMenu["Lista iteme"] = [(player,choice) => listedItems(player,choice)];

onNet("sn:openMarket", () => {
    vRP.openMenu(source,mainMenu);
});

