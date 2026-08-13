export type Gate = { _id?: string; name: string; lat: number; lng: number; radius?: number };
export function metersBetween(lat1:number,lng1:number,lat2:number,lng2:number){ const R=6371000,toRad=(d:number)=>d*Math.PI/180,dLat=toRad(lat2-lat1),dLng=toRad(lng2-lng1),a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLng/2)**2; return 2*R*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)); }
export function matchGate(position:{lat:number,lng:number}, gates:Gate[], radius=200){ return gates.map(g=>({ gateId:g._id, gateName:g.name, radius:g.radius ?? radius, distance:metersBetween(position.lat, position.lng, g.lat, g.lng) })).filter(g=>g.distance <= g.radius).sort((a,b)=>a.distance-b.distance)[0] || null; }
export default { metersBetween, matchGate };
