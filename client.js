const marketPos = {
    x: -41.824731,
    y: -1036.4431152344,
    z: 28.49133682251
};

Delay = (ms) => new Promise(res => setTimeout(res, ms));
let playerPed = GetPlayerPed(-1)
let inMenu = false;
setTick ( async () => {
    await Delay(2000);
    let [ x,y,z ] = GetEntityCoords(playerPed);
    if(GetDistanceBetweenCoords(x,y,z,marketPos.x,marketPos.y,marketPos.z,false) <= 1 && !inMenu) {
        emitNet("sn:openMarket");
        inMenu = true;
    } else {
        inMenu = false;
    }
});