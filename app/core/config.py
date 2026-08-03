from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    SUPABASE_URL: str
    SUPABASE_ANON_KEY: str
    SUPABASE_SERVICE_ROLE_KEY: str   # 추가

    PROOF_BUCKET: str = "read-proofs"
    KEYRING_BUCKET: str = "keyrings"

    PROOF_SIGNED_URL_EXPIRES_SEC: int = 60 * 60 * 24
    SIGNED_URL_EXPIRES_SEC: int = 60 * 60 * 24

    OPENAI_API_KEY: str
    OPENAI_IMAGE_MODEL: str = "gpt-image-1"
    OPENAI_PROMPT_MODEL: str = "gpt-4.1-mini"

    LOGIN_SERVER_JWT_SECRET: str = ""
    LOGIN_SERVER_ME_URL: str = ""

settings = Settings()