async function getAppointments(env) {
  const data = await env.API_DB.get("appointments");
  return data ? JSON.parse(data) : [];
}

async function saveAppointments(env, appointments) {
  await env.API_DB.put("appointments", JSON.stringify(appointments));
}

async function getHelpers(env) {
  const data = await env.API_DB.get("helpers");
  return data ? JSON.parse(data) : {};
}

async function saveHelpers(env, helpers) {
  await env.API_DB.put("helpers", JSON.stringify(helpers));
}

function jsonResponse(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

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

    if (url.pathname === "/api/helpers") {
      if (request.method === "GET") {
        const helpers = await getHelpers(env);
        const name = url.searchParams.get("name");
        if (name) {
          return jsonResponse(helpers[name] || null, corsHeaders);
        }
        return jsonResponse(Object.values(helpers), corsHeaders);
      }

      if (request.method === "POST") {
        const body = await request.json();
        const { name, skills, bio } = body;
        if (!name) {
          return jsonResponse({ error: "Nombre requerido" }, corsHeaders, 400);
        }
        const helpers = await getHelpers(env);
        const existing = helpers[name] || {
          name,
          skills: [],
          bio: "",
          ratingSum: 0,
          ratingCount: 0,
          completedJobs: 0,
        };
        helpers[name] = {
          ...existing,
          name,
          skills: skills || existing.skills,
          bio: bio !== undefined ? bio : existing.bio,
        };
        await saveHelpers(env, helpers);
        return jsonResponse({ success: true, helper: helpers[name] }, corsHeaders);
      }
    }

    if (url.pathname === "/api/appointments") {
      if (request.method === "GET") {
        const appointments = await getAppointments(env);
        return jsonResponse(appointments, corsHeaders);
      }

      if (request.method === "POST") {
        const newAppointment = await request.json();
        const appointments = await getAppointments(env);
        const appointment = {
          id: crypto.randomUUID(),
          clientName: newAppointment.clientName,
          service: newAppointment.service,
          price: newAppointment.price,
          time: newAppointment.time,
          description: newAppointment.description || "",
          status: "Pendiente",
          helperName: null,
          rating: null,
        };
        appointments.unshift(appointment);
        await saveAppointments(env, appointments);
        return jsonResponse({ success: true, appointment }, corsHeaders);
      }
    }

    if (url.pathname === "/api/appointments/accept" && request.method === "POST") {
      const { id, helperName } = await request.json();
      const appointments = await getAppointments(env);
      const appt = appointments.find((a) => a.id === id);
      if (!appt || appt.status !== "Pendiente") {
        return jsonResponse({ error: "Solicitud no disponible" }, corsHeaders, 404);
      }
      appt.status = "Asignado";
      appt.helperName = helperName;
      await saveAppointments(env, appointments);
      return jsonResponse({ success: true }, corsHeaders);
    }

    if (url.pathname === "/api/appointments/complete" && request.method === "POST") {
      const body = await request.json();
      const appointments = await getAppointments(env);
      let appt = null;

      if (body.id) {
        appt = appointments.find((a) => a.id === body.id);
      } else if (body.index !== undefined) {
        appt = appointments[body.index];
      }

      if (!appt) {
        return jsonResponse({ error: "Not found" }, corsHeaders, 404);
      }

      appt.status = "Completado";
      await saveAppointments(env, appointments);

      if (appt.helperName) {
        const helpers = await getHelpers(env);
        if (helpers[appt.helperName]) {
          helpers[appt.helperName].completedJobs += 1;
          await saveHelpers(env, helpers);
        }
      }

      return jsonResponse({ success: true }, corsHeaders);
    }

    if (url.pathname === "/api/appointments/rate" && request.method === "POST") {
      const { id, rating } = await request.json();
      if (!id || !rating || rating < 1 || rating > 5) {
        return jsonResponse({ error: "Calificación inválida" }, corsHeaders, 400);
      }
      const appointments = await getAppointments(env);
      const appt = appointments.find((a) => a.id === id);
      if (!appt || appt.status !== "Completado" || appt.rating) {
        return jsonResponse({ error: "No se puede calificar" }, corsHeaders, 400);
      }
      appt.rating = rating;
      await saveAppointments(env, appointments);

      if (appt.helperName) {
        const helpers = await getHelpers(env);
        if (helpers[appt.helperName]) {
          helpers[appt.helperName].ratingSum += rating;
          helpers[appt.helperName].ratingCount += 1;
          await saveHelpers(env, helpers);
        }
      }

      return jsonResponse({ success: true }, corsHeaders);
    }

    return new Response("Not found", { status: 404, headers: corsHeaders });
  },
};
