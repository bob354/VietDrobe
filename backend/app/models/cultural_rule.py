import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base
from app.models.types import JSONType


class CulturalRule(Base):
    """Data-driven cultural validation rules for garment combinations."""

    __tablename__ = "cultural_rules"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )

    rule_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # "incompatible", "warning", "required_with"

    # Condition: JSON describing when this rule triggers
    # Examples:
    #   {"garment_type": "ao_nhat_binh", "with_category": "modern_bottom"}
    #   {"garment_type": "ao_nhat_binh", "gender_fit": "nam"}
    condition: Mapped[dict] = mapped_column(JSONType, nullable=False)

    message_vi: Mapped[str] = mapped_column(Text, nullable=False)
    message_en: Mapped[str | None] = mapped_column(Text)

    severity: Mapped[str] = mapped_column(
        String(20), nullable=False, default="warning"
    )  # "error", "warning", "info"

    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    def __repr__(self) -> str:
        return f"<CulturalRule {self.rule_type}: {self.severity}>"
