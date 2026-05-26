export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
      "Access-Control-Max-Age": "86400",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === "/api/appointments") {
      if (request.method === "GET") {
        const data = await env.API_DB.get("appointments");
        return new Response(data || "[]", {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (request.method === "POST") {
        const newAppointment = await request.json();
        const existingData = await env.API_DB.get("appointments");
        let appointments = [];
        if (existingData) {
          appointments = JSON.parse(existingData);
        }
        
        appointments.unshift(newAppointment);
        await env.API_DB.put("appointments", JSON.stringify(appointments));

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (url.pathname === "/api/appointments/complete" && request.method === "POST") {
       const body = await request.json();
       const { index } = body;
       const existingData = await env.API_DB.get("appointments");
       if (existingData) {
          let appointments = JSON.parse(existingData);
          if (appointments[index]) {
             appointments[index].status = 'Completado';
             await env.API_DB.put("appointments", JSON.stringify(appointments));
             return new Response(JSON.stringify({ success: true }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
             });
          }
       }
       return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};
