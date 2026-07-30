from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.builder import Builder
from app.models.user import User, UserRole
from app.schemas.builder import BuilderCreate, BuilderUpdate, BuilderResponse
from app.middleware.auth_middleware import get_current_user, RequireRole

router = APIRouter(prefix="/builders", tags=["Builders"])

@router.get("", response_model=list[BuilderResponse])
def get_builders(
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Builder).filter(Builder.is_deleted == False)
    if search:
        query = query.filter(
            (Builder.name.ilike(f"%{search}%")) | (Builder.company.ilike(f"%{search}%"))
        )
    builders = query.order_by(Builder.name).all()
    
    result = []
    for b in builders:
        b_dict = BuilderResponse.model_validate(b)
        b_dict.projects_count = len([p for p in b.projects if not p.is_deleted])
        result.append(b_dict)
    return result

@router.get("/{builder_id}", response_model=BuilderResponse)
def get_builder(builder_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    builder = db.query(Builder).filter(Builder.id == builder_id, Builder.is_deleted == False).first()
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")
    res = BuilderResponse.model_validate(builder)
    res.projects_count = len([p for p in builder.projects if not p.is_deleted])
    return res

@router.post("", response_model=BuilderResponse, status_code=status.HTTP_201_CREATED)
def create_builder(
    builder_in: BuilderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    builder = Builder(**builder_in.model_dump())
    db.add(builder)
    db.commit()
    db.refresh(builder)
    res = BuilderResponse.model_validate(builder)
    res.projects_count = 0
    return res

@router.put("/{builder_id}", response_model=BuilderResponse)
def update_builder(
    builder_id: int,
    builder_in: BuilderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    builder = db.query(Builder).filter(Builder.id == builder_id, Builder.is_deleted == False).first()
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")

    for field, value in builder_in.model_dump(exclude_unset=True).items():
        setattr(builder, field, value)

    db.commit()
    db.refresh(builder)
    res = BuilderResponse.model_validate(builder)
    res.projects_count = len([p for p in builder.projects if not p.is_deleted])
    return res

@router.delete("/{builder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_builder(
    builder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN]))
):
    builder = db.query(Builder).filter(Builder.id == builder_id, Builder.is_deleted == False).first()
    if not builder:
        raise HTTPException(status_code=404, detail="Builder not found")

    builder.is_deleted = True
    db.commit()
