from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    gemma_endpoint_url: str = "http://localhost:8080/v1"
    gemma_api_key: str = "dummy"
    gemma_model_name: str = "gemma4"

    database_url: str = "sqlite:///./invoice_ocr.db"
    upload_dir: str = "storage/uploads"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
