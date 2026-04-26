from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemma_api_key: str = "dummy"
    gemma_model_name: str = "gemma-4-31b-it"
    gemma_thinking_level: str = "minimal"

    database_url: str = "sqlite:///./invoice_ocr.db"
    upload_dir: str = "storage/uploads"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


settings = Settings()
