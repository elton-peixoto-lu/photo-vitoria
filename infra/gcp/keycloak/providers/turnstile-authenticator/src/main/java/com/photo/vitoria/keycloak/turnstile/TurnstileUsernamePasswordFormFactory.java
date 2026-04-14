package com.photo.vitoria.keycloak.turnstile;

import org.keycloak.Config;
import org.keycloak.authentication.Authenticator;
import org.keycloak.authentication.AuthenticatorFactory;
import org.keycloak.models.AuthenticationExecutionModel;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;
import org.keycloak.provider.ProviderConfigProperty;

import java.util.List;

public final class TurnstileUsernamePasswordFormFactory implements AuthenticatorFactory {
    public static final String PROVIDER_ID = "turnstile-username-password-form";

    private static final TurnstileUsernamePasswordForm SINGLETON = new TurnstileUsernamePasswordForm();

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    @Override
    public String getDisplayType() {
        return "Username Password Form (Turnstile)";
    }

    @Override
    public String getHelpText() {
        return "Exige Cloudflare Turnstile no login e valida server-side via siteverify antes de checar usuario/senha.";
    }

    @Override
    public String getReferenceCategory() {
        return "password";
    }

    @Override
    public boolean isConfigurable() {
        return true;
    }

    @Override
    public List<ProviderConfigProperty> getConfigProperties() {
        ProviderConfigProperty siteKey = new ProviderConfigProperty();
        siteKey.setName(TurnstileUsernamePasswordForm.TurnstileConfig.CFG_SITE_KEY);
        siteKey.setLabel("Turnstile Site Key");
        siteKey.setType(ProviderConfigProperty.STRING_TYPE);
        siteKey.setHelpText("Opcional se TURNSTILE_SITE_KEY estiver no ambiente. Usado apenas para renderizar o widget.");

        ProviderConfigProperty secretKey = new ProviderConfigProperty();
        secretKey.setName(TurnstileUsernamePasswordForm.TurnstileConfig.CFG_SECRET_KEY);
        secretKey.setLabel("Turnstile Secret Key");
        secretKey.setType(ProviderConfigProperty.PASSWORD);
        secretKey.setHelpText("Obrigatorio (ou via TURNSTILE_SECRET_KEY). Nao vai para o frontend.");

        ProviderConfigProperty timeoutMs = new ProviderConfigProperty();
        timeoutMs.setName(TurnstileUsernamePasswordForm.TurnstileConfig.CFG_TIMEOUT_MS);
        timeoutMs.setLabel("Turnstile Timeout (ms)");
        timeoutMs.setType(ProviderConfigProperty.STRING_TYPE);
        timeoutMs.setDefaultValue("3500");
        timeoutMs.setHelpText("Timeout para chamada ao siteverify. Erro/timeout bloqueia login.");

        ProviderConfigProperty includeRemoteIp = new ProviderConfigProperty();
        includeRemoteIp.setName(TurnstileUsernamePasswordForm.TurnstileConfig.CFG_REMOTE_IP);
        includeRemoteIp.setLabel("Include remoteip");
        includeRemoteIp.setType(ProviderConfigProperty.BOOLEAN_TYPE);
        includeRemoteIp.setDefaultValue("false");
        includeRemoteIp.setHelpText("Se true, envia o IP remoto (remoteip) ao siteverify. Pode dar falso negativo atras de proxy.");

        return List.of(siteKey, secretKey, timeoutMs, includeRemoteIp);
    }

    @Override
    public Authenticator create(KeycloakSession session) {
        return SINGLETON;
    }

    @Override
    public void init(Config.Scope config) {
    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {
    }

    @Override
    public void close() {
    }

    @Override
    public boolean isUserSetupAllowed() {
        return false;
    }

    @Override
    public AuthenticationExecutionModel.Requirement[] getRequirementChoices() {
        return new AuthenticationExecutionModel.Requirement[]{
            AuthenticationExecutionModel.Requirement.REQUIRED,
            AuthenticationExecutionModel.Requirement.DISABLED
        };
    }
}
