package com.photo.vitoria.keycloak.turnstile;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.ws.rs.core.MultivaluedMap;
import jakarta.ws.rs.core.Response;
import org.keycloak.authentication.AuthenticationFlowContext;
import org.keycloak.authentication.AuthenticationFlowError;
import org.keycloak.authentication.authenticators.browser.UsernamePasswordForm;
import org.keycloak.forms.login.LoginFormsProvider;
import org.keycloak.models.AuthenticatorConfigModel;

import java.io.IOException;
import java.net.ProxySelector;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;
import java.util.Optional;

/**
 * Adiciona Cloudflare Turnstile ao fluxo "Username Password Form" do Keycloak.
 *
 * Pontos criticos:
 * - O segredo (secret key) nunca vai para o frontend; fica apenas no servidor.
 * - Nao existe bypass: token ausente/erro de rede/resposta invalida => bloqueia login.
 * - O `sitekey` e injetado como atributo do template para renderizacao do widget no tema.
 */
public final class TurnstileUsernamePasswordForm extends UsernamePasswordForm {
    static final String FORM_FIELD = "cf-turnstile-response";
    private static final URI SITEVERIFY_URI = URI.create("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Override
    public void authenticate(AuthenticationFlowContext context) {
        // Injeta o sitekey no template (login.ftl) para renderizar o widget.
        String siteKey = TurnstileConfig.resolveSiteKey(context.getAuthenticatorConfig());
        if (siteKey != null && !siteKey.isBlank()) {
            context.form().setAttribute("turnstileSiteKey", siteKey);
        }
        super.authenticate(context);
    }

    @Override
    protected boolean validateForm(AuthenticationFlowContext context, MultivaluedMap<String, String> formData) {
        TurnstileConfig config = TurnstileConfig.from(context.getAuthenticatorConfig());

        if (config.siteKey == null || config.siteKey.isBlank() || config.secretKey == null || config.secretKey.isBlank()) {
            return fail(context, formData, "turnstileMisconfigured");
        }

        String token = Optional.ofNullable(formData.getFirst(FORM_FIELD)).map(String::trim).orElse("");
        if (token.isBlank()) {
            return fail(context, formData, "turnstileMissing");
        }

        String remoteIp = null;
        if (config.includeRemoteIp) {
            remoteIp = resolveRemoteIp(context);
        }

        boolean ok;
        try {
            ok = verify(config, token, remoteIp);
        } catch (Exception e) {
            ok = false;
        }

        if (!ok) {
            return fail(context, formData, "turnstileFailed");
        }

        return super.validateForm(context, formData);
    }

    private static boolean verify(TurnstileConfig config, String token, String remoteIp) throws IOException, InterruptedException {
        String body = urlEncode(Map.of(
            "secret", config.secretKey,
            "response", token
        )) + (remoteIp == null || remoteIp.isBlank() ? "" : "&remoteip=" + URLEncoder.encode(remoteIp, StandardCharsets.UTF_8));

        HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofMillis(config.timeoutMs))
            .proxy(ProxySelector.getDefault())
            .build();

        HttpRequest request = HttpRequest.newBuilder()
            .uri(SITEVERIFY_URI)
            .timeout(Duration.ofMillis(config.timeoutMs))
            .header("Content-Type", "application/x-www-form-urlencoded")
            .POST(HttpRequest.BodyPublishers.ofString(body))
            .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            return false;
        }

        JsonNode json;
        try {
            json = OBJECT_MAPPER.readTree(response.body());
        } catch (Exception e) {
            return false;
        }

        return json != null && json.has("success") && json.get("success").asBoolean(false);
    }

    private static String resolveRemoteIp(AuthenticationFlowContext context) {
        try {
            // Em geral, o Keycloak roda atras de proxy. O remote address pode nao ser o IP real do cliente.
            // Mesmo assim, enviar remoteip e opcional; mantemos configuravel para reduzir falsos negativos.
            return context.getConnection().getRemoteAddr();
        } catch (Exception e) {
            return null;
        }
    }

    private static String urlEncode(Map<String, String> params) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (sb.length() > 0) sb.append("&");
            sb.append(URLEncoder.encode(entry.getKey(), StandardCharsets.UTF_8));
            sb.append("=");
            sb.append(URLEncoder.encode(entry.getValue(), StandardCharsets.UTF_8));
        }
        return sb.toString();
    }

    private static boolean fail(AuthenticationFlowContext context, MultivaluedMap<String, String> formData, String messageKey) {
        LoginFormsProvider form = context.form();
        if (formData != null && !formData.isEmpty()) {
            form.setFormData(formData);
        }
        form.setError(messageKey);
        Response challenge = form.createLoginUsernamePassword();
        context.failureChallenge(AuthenticationFlowError.INVALID_CREDENTIALS, challenge);
        return false;
    }

    /**
     * Config resolve centralizado (config do Authenticator > env vars).
     */
    static final class TurnstileConfig {
        static final String CFG_SITE_KEY = "turnstileSiteKey";
        static final String CFG_SECRET_KEY = "turnstileSecretKey";
        static final String CFG_TIMEOUT_MS = "turnstileTimeoutMs";
        static final String CFG_REMOTE_IP = "turnstileIncludeRemoteIp";

        final String siteKey;
        final String secretKey;
        final long timeoutMs;
        final boolean includeRemoteIp;

        private TurnstileConfig(String siteKey, String secretKey, long timeoutMs, boolean includeRemoteIp) {
            this.siteKey = siteKey;
            this.secretKey = secretKey;
            this.timeoutMs = timeoutMs;
            this.includeRemoteIp = includeRemoteIp;
        }

        static TurnstileConfig from(AuthenticatorConfigModel cfg) {
            String siteKey = firstNonBlank(resolveConfig(cfg, CFG_SITE_KEY), System.getenv("TURNSTILE_SITE_KEY"));
            String secretKey = firstNonBlank(resolveConfig(cfg, CFG_SECRET_KEY), System.getenv("TURNSTILE_SECRET_KEY"));

            long timeoutMs = parseLong(firstNonBlank(resolveConfig(cfg, CFG_TIMEOUT_MS), System.getenv("TURNSTILE_TIMEOUT_MS")), 3500L);
            boolean includeRemoteIp = parseBool(firstNonBlank(resolveConfig(cfg, CFG_REMOTE_IP), System.getenv("TURNSTILE_INCLUDE_REMOTE_IP")), false);

            return new TurnstileConfig(siteKey, secretKey, timeoutMs, includeRemoteIp);
        }

        static String resolveSiteKey(AuthenticatorConfigModel cfg) {
            return firstNonBlank(resolveConfig(cfg, CFG_SITE_KEY), System.getenv("TURNSTILE_SITE_KEY"));
        }

        private static String resolveConfig(AuthenticatorConfigModel cfg, String key) {
            if (cfg == null) return null;
            Map<String, String> map = cfg.getConfig();
            if (map == null) return null;
            return map.get(key);
        }

        private static long parseLong(String raw, long fallback) {
            if (raw == null || raw.isBlank()) return fallback;
            try {
                return Long.parseLong(raw.trim());
            } catch (Exception e) {
                return fallback;
            }
        }

        private static boolean parseBool(String raw, boolean fallback) {
            if (raw == null || raw.isBlank()) return fallback;
            String v = raw.trim().toLowerCase();
            if (v.equals("true") || v.equals("1") || v.equals("yes") || v.equals("y")) return true;
            if (v.equals("false") || v.equals("0") || v.equals("no") || v.equals("n")) return false;
            return fallback;
        }

        private static String firstNonBlank(String a, String b) {
            if (a != null && !a.isBlank()) return a;
            if (b != null && !b.isBlank()) return b;
            return null;
        }
    }
}

