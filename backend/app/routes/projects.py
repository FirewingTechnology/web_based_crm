from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.project import Project, ProjectStatus
from app.models.builder import Builder
from app.models.user import User, UserRole
from app.schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from app.middleware.auth_middleware import get_current_user, RequireRole

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=list[ProjectResponse])
def get_projects(
    builder_id: int | None = None,
    status: ProjectStatus | None = None,
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Project).filter(Project.is_deleted == False)
    if builder_id:
        query = query.filter(Project.builder_id == builder_id)
    if status:
        query = query.filter(Project.status == status)
    if search:
        query = query.filter(
            (Project.name.ilike(f"%{search}%")) | (Project.location.ilike(f"%{search}%"))
        )
    projects = query.order_by(Project.name).all()
    
    res = []
    for p in projects:
        p_res = ProjectResponse.model_validate(p)
        p_res.builder_name = p.builder.name if p.builder else "Unknown"
        res.append(p_res)
    return res

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    project = db.query(Project).filter(Project.id == project_id, Project.is_deleted == False).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    res = ProjectResponse.model_validate(project)
    res.builder_name = project.builder.name if project.builder else "Unknown"
    return res

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    builder = None
    if project_in.new_builder_name and project_in.new_builder_name.strip():
        b_name = project_in.new_builder_name.strip()
        builder = db.query(Builder).filter(Builder.name.ilike(b_name), Builder.is_deleted == False).first()
        if not builder:
            builder = Builder(
                name=b_name,
                company=b_name,
                contact_person="Admin",
                email=f"info@{b_name.lower().replace(' ', '')}.com",
                phone="+91 98100 00000",
                address="Noida, Uttar Pradesh",
                commission_rate=3.5,
                notes="Registered via Project Creation"
            )
            db.add(builder)
            db.flush()

    if not builder and project_in.builder_id:
        builder = db.query(Builder).filter(Builder.id == project_in.builder_id, Builder.is_deleted == False).first()
    if not builder:
        builder = db.query(Builder).filter(Builder.is_deleted == False).first()
    if not builder:
        builder = Builder(
            name="General Real Estate Developer",
            company="General Real Estate Developer",
            contact_person="Admin",
            email="developer@brokeros.com",
            phone="+91 98100 00000",
            address="Noida, Uttar Pradesh",
            commission_rate=3.5,
            notes="Default Developer"
        )
        db.add(builder)
        db.flush()

    project_data = project_in.model_dump(exclude={"new_builder_name"})
    project_data["builder_id"] = builder.id
    project = Project(**project_data)
    db.add(project)
    db.commit()
    db.refresh(project)
    
    res = ProjectResponse.model_validate(project)
    res.builder_name = builder.name
    return res

@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN, UserRole.MANAGER]))
):
    project = db.query(Project).filter(Project.id == project_id, Project.is_deleted == False).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in project_in.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    res = ProjectResponse.model_validate(project)
    res.builder_name = project.builder.name if project.builder else "Unknown"
    return res

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(RequireRole([UserRole.ADMIN]))
):
    project = db.query(Project).filter(Project.id == project_id, Project.is_deleted == False).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.is_deleted = True
    db.commit()
