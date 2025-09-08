from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from typing import Annotated, List
import jwt
from jwt.exceptions import InvalidTokenError
from passlib.context import CryptContext

from database import get_db, engine
from models import Base, User, Project, Assistant, File, Tool, PhoneNumber, CallLog, AnalyticsSnapshot
from schemas import (
    UserCreate, UserResponse, Token, ProjectCreate, Project as ProjectSchema,
    AssistantCreate, AssistantUpdate, AssistantResponse, AssistantListResponse,
    FileCreate, FileResponse, ToolCreate, ToolUpdate, ToolResponse,
    PhoneNumberCreate, PhoneNumberResponse,
    CallLogCreate, CallLogUpdate, CallLogResponse,
    AnalyticsSummary, AnalyticsCallHistory, AnalyticsChart, 
    AnalyticsPerformance, AnalyticsRealtime, BillingAnalytics,
    OutboundCallStart, OutboundCallResponse, OutboundCallStatus, CreditCheckResponse
)

# Erstelle die Datenbanktabellen beim Start
Base.metadata.create_all(bind=engine)

app = FastAPI(title="FastAPI Authentication System")

# Konfiguration
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Bearer Token Schema
security = HTTPBearer()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifiziert ein Passwort gegen den Hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Erstellt einen Hash aus einem Passwort."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """Erstellt einen JWT Access Token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_email(db: Session, email: str):
    """Holt einen User anhand der E-Mail-Adresse."""
    return db.query(User).filter(User.email == email).first()

def authenticate_user(db: Session, email: str, password: str):
    """Authentifiziert einen User."""
    user = get_user_by_email(db, email)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: Session = Depends(get_db)
):
    """Dependency Funktion zum Abrufen des aktuellen Users aus dem JWT Token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception
    
    user = get_user_by_email(db, email=email)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)]
):
    """Dependency Funktion für aktive User."""
    return current_user

# API Endpoints

@app.post("/users/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    """Registrierung eines neuen Users."""
    # Prüfen ob User bereits existiert
    db_user = get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(
            status_code=400, 
            detail="Email already registered"
        )
    
    # Passwort hashen und User erstellen
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

@app.post("/token", response_model=Token)
def login_for_access_token(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    """Login und Token-Erstellung."""
    user_obj = authenticate_user(db, user.email, user.password)
    if not user_obj:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_obj.email}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer"
    }

@app.get("/users/me", response_model=UserResponse)
def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Geschützter Endpoint - zeigt Daten des eingeloggten Users."""
    return current_user

# Project Endpoints

@app.post("/projects/", response_model=ProjectSchema)
def create_project(
    project: ProjectCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Erstellt ein neues Projekt für den aktuell eingeloggten User."""
    db_project = Project(
        title=project.title,
        description=project.description,
        owner_id=current_user.id
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    return db_project

@app.get("/projects/", response_model=List[ProjectSchema])
def get_projects(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Gibt alle Projekte des aktuell eingeloggten Users zurück."""
    projects = db.query(Project).filter(Project.owner_id == current_user.id).all()
    return projects

@app.get("/")
def read_root():
    """Root Endpoint."""
    return {"message": "FastAPI Authentication System with Projects is running!"}

# Assistant Endpoints

@app.post("/api/assistants/", response_model=AssistantResponse)
def create_assistant(
    assistant: AssistantCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Erstellt einen neuen Assistant."""
    # Erstelle Assistant
    db_assistant = Assistant(
        name=assistant.name,
        description=assistant.description,
        system_prompt=assistant.system_prompt,
        llm_provider=assistant.llm_provider,
        llm_model=assistant.llm_model,
        temperature=assistant.temperature,
        max_tokens=assistant.max_tokens,
        voice_provider=assistant.voice_provider,
        voice_id=assistant.voice_id,
        voice_speed=assistant.voice_speed,
        voice_pitch=assistant.voice_pitch,
        voice_stability=assistant.voice_stability,
        language=assistant.language,
        fallback_language=assistant.fallback_language,
        first_message=assistant.first_message,
        interruption_sensitivity=assistant.interruption_sensitivity,
        silence_timeout=assistant.silence_timeout,
        response_delay=assistant.response_delay,
        capabilities=assistant.capabilities,
        owner_id=current_user.id
    )
    
    db.add(db_assistant)
    db.commit()
    db.refresh(db_assistant)
    
    # Verknüpfe Tools
    if assistant.tool_ids:
        tools = db.query(Tool).filter(
            Tool.id.in_(assistant.tool_ids),
            Tool.owner_id == current_user.id
        ).all()
        db_assistant.tools.extend(tools)
    
    # Verknüpfe Files
    if assistant.file_ids:
        files = db.query(File).filter(
            File.id.in_(assistant.file_ids),
            File.owner_id == current_user.id
        ).all()
        db_assistant.files.extend(files)
    
    db.commit()
    db.refresh(db_assistant)
    
    return db_assistant


@app.get("/api/assistants/", response_model=List[AssistantListResponse])
def get_assistants(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """Gibt alle Assistants des Users zurück."""
    query = db.query(Assistant).filter(Assistant.owner_id == current_user.id)
    
    if status:
        query = query.filter(Assistant.status == status)
    if is_active is not None:
        query = query.filter(Assistant.is_active == is_active)
    
    assistants = query.offset(skip).limit(limit).all()
    
    # Füge Statistiken hinzu
    result = []
    for assistant in assistants:
        assistant_dict = {
            "id": assistant.id,
            "name": assistant.name,
            "description": assistant.description,
            "status": assistant.status,
            "is_active": assistant.is_active,
            "voice_provider": assistant.voice_provider,
            "llm_model": assistant.llm_model,
            "language": assistant.language,
            "created_at": assistant.created_at,
            "updated_at": assistant.updated_at,
            "tools_count": len(assistant.tools),
            "files_count": len(assistant.files)
        }
        result.append(AssistantListResponse(**assistant_dict))
    
    return result


@app.get("/api/assistants/{assistant_id}", response_model=AssistantResponse)
def get_assistant(
    assistant_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Gibt einen spezifischen Assistant zurück."""
    assistant = db.query(Assistant).filter(
        Assistant.id == assistant_id,
        Assistant.owner_id == current_user.id
    ).first()
    
    if not assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    return assistant


@app.put("/api/assistants/{assistant_id}", response_model=AssistantResponse)
def update_assistant(
    assistant_id: int,
    assistant_update: AssistantUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Aktualisiert einen Assistant."""
    db_assistant = db.query(Assistant).filter(
        Assistant.id == assistant_id,
        Assistant.owner_id == current_user.id
    ).first()
    
    if not db_assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    # Update Felder
    update_data = assistant_update.model_dump(exclude_unset=True)
    
    # Entferne Many-to-Many Felder
    tool_ids = update_data.pop('tool_ids', None)
    file_ids = update_data.pop('file_ids', None)
    
    # Update Standard-Felder
    for field, value in update_data.items():
        setattr(db_assistant, field, value)
    
    # Update Many-to-Many Relations
    if tool_ids is not None:
        tools = db.query(Tool).filter(
            Tool.id.in_(tool_ids),
            Tool.owner_id == current_user.id
        ).all()
        db_assistant.tools = tools
    
    if file_ids is not None:
        files = db.query(File).filter(
            File.id.in_(file_ids),
            File.owner_id == current_user.id
        ).all()
        db_assistant.files = files
    
    db.commit()
    db.refresh(db_assistant)
    
    return db_assistant


@app.delete("/api/assistants/{assistant_id}")
def delete_assistant(
    assistant_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Löscht einen Assistant."""
    db_assistant = db.query(Assistant).filter(
        Assistant.id == assistant_id,
        Assistant.owner_id == current_user.id
    ).first()
    
    if not db_assistant:
        raise HTTPException(status_code=404, detail="Assistant not found")
    
    db.delete(db_assistant)
    db.commit()
    
    return {"success": True, "message": "Assistant deleted successfully"}


# Tool Endpoints

@app.post("/api/tools/", response_model=ToolResponse)
def create_tool(
    tool: ToolCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Erstellt ein neues Tool."""
    db_tool = Tool(
        name=tool.name,
        description=tool.description,
        endpoint=tool.endpoint,
        method=tool.method,
        category=tool.category,
        parameters=tool.parameters,
        headers=tool.headers,
        authentication=tool.authentication,
        owner_id=current_user.id
    )
    
    db.add(db_tool)
    db.commit()
    db.refresh(db_tool)
    
    return db_tool


@app.get("/api/tools/", response_model=List[ToolResponse])  
def get_tools(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """Gibt alle Tools des Users zurück."""
    query = db.query(Tool).filter(Tool.owner_id == current_user.id)
    
    if category:
        query = query.filter(Tool.category == category)
    if is_active is not None:
        query = query.filter(Tool.is_active == is_active)
    
    tools = query.offset(skip).limit(limit).all()
    return tools


@app.put("/api/tools/{tool_id}", response_model=ToolResponse)
def update_tool(
    tool_id: int,
    tool_update: ToolUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Aktualisiert ein Tool."""
    db_tool = db.query(Tool).filter(
        Tool.id == tool_id,
        Tool.owner_id == current_user.id
    ).first()
    
    if not db_tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    update_data = tool_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_tool, field, value)
    
    db.commit()
    db.refresh(db_tool)
    
    return db_tool


@app.delete("/api/tools/{tool_id}")
def delete_tool(
    tool_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Löscht ein Tool."""
    db_tool = db.query(Tool).filter(
        Tool.id == tool_id,
        Tool.owner_id == current_user.id
    ).first()
    
    if not db_tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    db.delete(db_tool)
    db.commit()
    
    return {"success": True, "message": "Tool deleted successfully"}


# File Endpoints

@app.post("/api/files/", response_model=FileResponse)
def create_file(
    file: FileCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Erstellt eine neue File-Referenz."""
    db_file = File(
        filename=file.filename,
        original_name=file.original_name,
        file_type=file.file_type,
        file_size=file.file_size,
        description=file.description,
        owner_id=current_user.id
    )
    
    db.add(db_file)
    db.commit()
    db.refresh(db_file)
    
    return db_file


@app.get("/api/files/", response_model=List[FileResponse])
def get_files(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Gibt alle Files des Users zurück."""
    files = db.query(File).filter(
        File.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return files


@app.delete("/api/files/{file_id}")
def delete_file(
    file_id: int,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Löscht eine File."""
    db_file = db.query(File).filter(
        File.id == file_id,
        File.owner_id == current_user.id
    ).first()
    
    if not db_file:
        raise HTTPException(status_code=404, detail="File not found")
    
    db.delete(db_file)
    db.commit()
    
    return {"success": True, "message": "File deleted successfully"}


# Phone Number Endpoints

@app.post("/api/phone-numbers/", response_model=PhoneNumberResponse)
def create_phone_number(
    phone_number: PhoneNumberCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Erstellt eine neue Phone Number."""
    db_phone = PhoneNumber(
        phone_number=phone_number.phone_number,
        friendly_name=phone_number.friendly_name,
        capabilities=phone_number.capabilities,
        country=phone_number.country,
        region=phone_number.region,
        locality=phone_number.locality,
        provider=phone_number.provider,
        monthly_price=phone_number.monthly_price,
        currency=phone_number.currency,
        configuration=phone_number.configuration,
        assistant_id=phone_number.assistant_id,
        owner_id=current_user.id
    )
    
    db.add(db_phone)
    db.commit()
    db.refresh(db_phone)
    
    return db_phone


@app.get("/api/phone-numbers/", response_model=List[PhoneNumberResponse])
def get_phone_numbers(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    """Gibt alle Phone Numbers des Users zurück."""
    phone_numbers = db.query(PhoneNumber).filter(
        PhoneNumber.owner_id == current_user.id
    ).offset(skip).limit(limit).all()
    
    return phone_numbers


# Analytics Endpoints

@app.get("/api/analytics/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
    period: str = "today",  # today, week, month, custom
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Gibt Analytics Summary für den angegebenen Zeitraum zurück."""
    from datetime import datetime, timedelta
    from sqlalchemy import func, and_
    
    # Bestimme Zeitraum
    now = datetime.utcnow()
    if period == "today":
        period_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        period_end = now
    elif period == "week":
        period_start = now - timedelta(days=7)
        period_end = now
    elif period == "month":
        period_start = now - timedelta(days=30)
        period_end = now
    else:  # custom
        if start_date and end_date:
            period_start = datetime.fromisoformat(start_date)
            period_end = datetime.fromisoformat(end_date)
        else:
            period_start = now - timedelta(days=7)
            period_end = now
    
    # Query Call Logs für den Zeitraum
    calls_query = db.query(CallLog).filter(
        and_(
            CallLog.owner_id == current_user.id,
            CallLog.start_time >= period_start,
            CallLog.start_time <= period_end
        )
    )
    
    all_calls = calls_query.all()
    
    if not all_calls:
        # Leere Antwort für Zeitraum ohne Anrufe
        return AnalyticsSummary(
            period_start=period_start,
            period_end=period_end,
            period_type=period,
            total_calls=0,
            successful_calls=0,
            failed_calls=0,
            abandoned_calls=0,
            success_rate=0.0,
            total_duration_seconds=0,
            total_duration_minutes=0.0,
            total_duration_hours=0.0,
            avg_duration_seconds=0.0,
            min_duration_seconds=0,
            max_duration_seconds=0,
            total_credits_consumed=0.0,
            total_cost_usd=0.0,
            total_cost_eur=0.0,
            avg_cost_per_call=0.0,
            cost_per_minute=0.0
        )
    
    # Berechne Metriken
    total_calls = len(all_calls)
    successful_calls = len([c for c in all_calls if c.status == 'completed'])
    failed_calls = len([c for c in all_calls if c.status in ['failed', 'busy']])
    abandoned_calls = len([c for c in all_calls if c.status == 'canceled'])
    success_rate = (successful_calls / total_calls) * 100 if total_calls > 0 else 0.0
    
    # Duration Metriken
    durations = [c.duration_seconds for c in all_calls if c.duration_seconds]
    total_duration_seconds = sum(durations) if durations else 0
    total_duration_minutes = total_duration_seconds / 60
    total_duration_hours = total_duration_minutes / 60
    avg_duration_seconds = total_duration_seconds / len(durations) if durations else 0
    min_duration_seconds = min(durations) if durations else 0
    max_duration_seconds = max(durations) if durations else 0
    
    # Financial Metriken
    total_credits_consumed = sum([c.credits_consumed for c in all_calls])
    total_cost_usd = sum([c.cost_usd or 0 for c in all_calls])
    total_cost_eur = sum([c.cost_eur or 0 for c in all_calls])
    avg_cost_per_call = total_cost_eur / total_calls if total_calls > 0 else 0
    cost_per_minute = total_cost_eur / total_duration_minutes if total_duration_minutes > 0 else 0
    
    # Quality Metriken
    quality_scores = [c.call_quality_score for c in all_calls if c.call_quality_score]
    avg_quality_score = sum(quality_scores) / len(quality_scores) if quality_scores else None
    
    response_times = [c.ai_response_time_ms for c in all_calls if c.ai_response_time_ms]
    avg_ai_response_time_ms = sum(response_times) / len(response_times) if response_times else None
    
    confidences = [c.ai_confidence_avg for c in all_calls if c.ai_confidence_avg]
    avg_ai_confidence = sum(confidences) / len(confidences) if confidences else None
    
    satisfaction_scores = [c.customer_satisfaction for c in all_calls if c.customer_satisfaction]
    avg_customer_satisfaction = sum(satisfaction_scores) / len(satisfaction_scores) if satisfaction_scores else None
    
    # Top Performers
    if all_calls:
        # Top Assistant
        assistant_calls = {}
        for call in all_calls:
            if call.assistant_id:
                assistant_calls[call.assistant_id] = assistant_calls.get(call.assistant_id, 0) + 1
        
        top_assistant = None
        if assistant_calls:
            top_assistant_id = max(assistant_calls, key=assistant_calls.get)
            assistant = db.query(Assistant).filter(Assistant.id == top_assistant_id).first()
            if assistant:
                top_assistant = {
                    "id": assistant.id,
                    "name": assistant.name,
                    "calls": assistant_calls[top_assistant_id]
                }
        
        # Top Country
        country_calls = {}
        for call in all_calls:
            if call.country_code:
                country_calls[call.country_code] = country_calls.get(call.country_code, 0) + 1
        
        top_country = max(country_calls, key=country_calls.get) if country_calls else None
    else:
        top_assistant = None
        top_country = None
    
    return AnalyticsSummary(
        period_start=period_start,
        period_end=period_end,
        period_type=period,
        total_calls=total_calls,
        successful_calls=successful_calls,
        failed_calls=failed_calls,
        abandoned_calls=abandoned_calls,
        success_rate=success_rate,
        total_duration_seconds=total_duration_seconds,
        total_duration_minutes=total_duration_minutes,
        total_duration_hours=total_duration_hours,
        avg_duration_seconds=avg_duration_seconds,
        min_duration_seconds=min_duration_seconds,
        max_duration_seconds=max_duration_seconds,
        total_credits_consumed=total_credits_consumed,
        total_cost_usd=total_cost_usd,
        total_cost_eur=total_cost_eur,
        avg_cost_per_call=avg_cost_per_call,
        cost_per_minute=cost_per_minute,
        avg_quality_score=avg_quality_score,
        avg_ai_response_time_ms=avg_ai_response_time_ms,
        avg_ai_confidence=avg_ai_confidence,
        avg_customer_satisfaction=avg_customer_satisfaction,
        top_assistant=top_assistant,
        top_country=top_country
    )


@app.get("/api/analytics/call-history", response_model=AnalyticsCallHistory)
def get_call_history(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    assistant_id: Optional[int] = None,
    phone_number_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    search: Optional[str] = None
):
    """Gibt detaillierte Call History zurück."""
    from datetime import datetime
    from sqlalchemy import and_, or_
    
    # Base Query
    query = db.query(CallLog).filter(CallLog.owner_id == current_user.id)
    
    # Apply Filters
    if status:
        query = query.filter(CallLog.status == status)
    
    if assistant_id:
        query = query.filter(CallLog.assistant_id == assistant_id)
    
    if phone_number_id:
        query = query.filter(CallLog.phone_number_id == phone_number_id)
    
    if start_date:
        query = query.filter(CallLog.start_time >= datetime.fromisoformat(start_date))
    
    if end_date:
        query = query.filter(CallLog.start_time <= datetime.fromisoformat(end_date))
    
    if search:
        query = query.filter(
            or_(
                CallLog.caller_number.ilike(f"%{search}%"),
                CallLog.called_number.ilike(f"%{search}%"),
                CallLog.call_sid.ilike(f"%{search}%")
            )
        )
    
    # Get total count
    total_calls = query.count()
    
    # Apply pagination and get results
    calls = query.order_by(CallLog.start_time.desc()).offset(skip).limit(limit).all()
    
    # Enrich with related data
    enriched_calls = []
    for call in calls:
        call_dict = {
            "id": call.id,
            "call_sid": call.call_sid,
            "phone_number_id": call.phone_number_id,
            "assistant_id": call.assistant_id,
            "caller_number": call.caller_number,
            "called_number": call.called_number,
            "direction": call.direction,
            "start_time": call.start_time,
            "end_time": call.end_time,
            "duration_seconds": call.duration_seconds,
            "billable_seconds": call.billable_seconds,
            "status": call.status,
            "hangup_cause": call.hangup_cause,
            "call_quality_score": call.call_quality_score,
            "ai_response_time_ms": call.ai_response_time_ms,
            "ai_interruptions": call.ai_interruptions,
            "ai_confidence_avg": call.ai_confidence_avg,
            "conversation_turns": call.conversation_turns,
            "credits_consumed": call.credits_consumed,
            "cost_usd": call.cost_usd,
            "cost_eur": call.cost_eur,
            "sentiment_score": call.sentiment_score,
            "intent_detected": call.intent_detected,
            "customer_satisfaction": call.customer_satisfaction,
            "country_code": call.country_code,
            "region": call.region,
            "created_at": call.created_at
        }
        
        # Add Assistant name
        if call.assistant_id:
            assistant = db.query(Assistant).filter(Assistant.id == call.assistant_id).first()
            call_dict["assistant_name"] = assistant.name if assistant else None
        
        # Add Phone Number
        phone_number = db.query(PhoneNumber).filter(PhoneNumber.id == call.phone_number_id).first()
        call_dict["phone_number"] = phone_number.phone_number if phone_number else None
        
        enriched_calls.append(CallLogResponse(**call_dict))
    
    # Calculate summary stats
    total_duration_seconds = sum([c.duration_seconds or 0 for c in calls])
    total_credits_consumed = sum([c.credits_consumed for c in calls])
    
    summary_stats = {
        "avg_duration": total_duration_seconds / len(calls) if calls else 0,
        "total_credits": total_credits_consumed,
        "success_rate": len([c for c in calls if c.status == 'completed']) / len(calls) * 100 if calls else 0
    }
    
    return AnalyticsCallHistory(
        calls=enriched_calls,
        pagination={
            "total": total_calls,
            "skip": skip,
            "limit": limit,
            "has_more": skip + limit < total_calls
        },
        filters_applied={
            "status": status,
            "assistant_id": assistant_id,
            "phone_number_id": phone_number_id,
            "start_date": start_date,
            "end_date": end_date,
            "search": search
        },
        total_calls=total_calls,
        total_duration_seconds=total_duration_seconds,
        total_credits_consumed=total_credits_consumed,
        summary_stats=summary_stats
    )


@app.get("/api/analytics/charts/{chart_type}")
def get_analytics_chart(
    chart_type: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
    period: str = "week"
):
    """Gibt Chart-Daten für Analytics zurück."""
    from datetime import datetime, timedelta
    from collections import defaultdict
    
    # Bestimme Zeitraum
    now = datetime.utcnow()
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    else:
        start_date = now - timedelta(days=7)
    
    # Query Calls
    calls = db.query(CallLog).filter(
        and_(
            CallLog.owner_id == current_user.id,
            CallLog.start_time >= start_date
        )
    ).all()
    
    if chart_type == "calls_over_time":
        # Calls über Zeit (Linie)
        daily_calls = defaultdict(int)
        for call in calls:
            day = call.start_time.strftime('%Y-%m-%d')
            daily_calls[day] += 1
        
        labels = sorted(daily_calls.keys())
        data = [daily_calls[day] for day in labels]
        
        return AnalyticsChart(
            chart_type="line",
            title="Anrufe über Zeit",
            labels=labels,
            datasets=[{
                "label": "Anrufe",
                "data": data,
                "borderColor": "rgb(59, 130, 246)",
                "backgroundColor": "rgba(59, 130, 246, 0.1)"
            }],
            period=period,
            total_data_points=len(labels)
        )
    
    elif chart_type == "status_distribution":
        # Status Verteilung (Pie)
        status_counts = defaultdict(int)
        for call in calls:
            status_counts[call.status] += 1
        
        return AnalyticsChart(
            chart_type="pie",
            title="Anruf-Status Verteilung",
            labels=list(status_counts.keys()),
            datasets=[{
                "data": list(status_counts.values()),
                "backgroundColor": [
                    "rgb(34, 197, 94)",   # completed - green
                    "rgb(239, 68, 68)",   # failed - red
                    "rgb(245, 158, 11)",  # busy - yellow
                    "rgb(156, 163, 175)"  # other - gray
                ]
            }],
            period=period,
            total_data_points=len(status_counts)
        )
    
    else:
        raise HTTPException(status_code=404, detail="Chart type not found")


@app.post("/api/analytics/call-logs", response_model=CallLogResponse)
def create_call_log(
    call_log: CallLogCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Erstellt einen neuen Call Log Entry."""
    from billing import CallLogger
    
    logger = CallLogger(db)
    
    try:
        db_call_log = logger.start_call(call_log)
        return db_call_log
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.put("/api/analytics/call-logs/{call_sid}", response_model=CallLogResponse)
def update_call_log(
    call_sid: str,
    call_update: CallLogUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Aktualisiert einen Call Log Entry."""
    from billing import CallLogger
    
    logger = CallLogger(db)
    
    try:
        db_call_log = logger.update_call(call_sid, call_update)
        if not db_call_log:
            raise HTTPException(status_code=404, detail="Call log not found")
        return db_call_log
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# Outbound Call Endpoints

@app.post("/api/outbound/start-call", response_model=OutboundCallResponse)
def start_outbound_call(
    call_request: OutboundCallStart,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Startet einen Outbound-Anruf."""
    from outbound_service import OutboundCallService
    
    try:
        service = OutboundCallService(db)
        result = service.initiate_outbound_call(call_request, current_user.id)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Outbound call failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate outbound call")


@app.get("/api/outbound/credit-check", response_model=CreditCheckResponse)
def check_outbound_credits(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
    estimated_duration: float = 5.0
):
    """Prüft die verfügbaren Credits für Outbound-Anrufe."""
    from outbound_service import OutboundCallService
    
    try:
        service = OutboundCallService(db)
        credit_check = service.check_user_credits(current_user.id, estimated_duration)
        return credit_check
    except Exception as e:
        logger.error(f"Credit check failed: {e}")
        raise HTTPException(status_code=500, detail="Credit check failed")


@app.get("/api/outbound/call-status/{call_sid}")
def get_outbound_call_status(
    call_sid: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    """Ruft den Status eines Outbound-Anrufs ab."""
    from outbound_service import OutboundCallService
    
    try:
        service = OutboundCallService(db)
        status = service.get_call_status(call_sid, current_user.id)
        
        if not status:
            raise HTTPException(status_code=404, detail="Call not found")
        
        return {"success": True, "data": status}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get call status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get call status")


@app.get("/api/outbound/history")
def get_outbound_call_history(
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 50,
    status: Optional[str] = None,
    assistant_id: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    """Gibt die Outbound-Anruf Historie zurück."""
    from datetime import datetime
    from sqlalchemy import and_
    
    try:
        # Base Query für Outbound Calls
        query = db.query(CallLog).filter(
            CallLog.owner_id == current_user.id,
            CallLog.direction == "outbound"
        )
        
        # Apply Filters
        if status:
            query = query.filter(CallLog.status == status)
        
        if assistant_id:
            query = query.filter(CallLog.assistant_id == assistant_id)
        
        if start_date:
            query = query.filter(CallLog.start_time >= datetime.fromisoformat(start_date))
        
        if end_date:
            query = query.filter(CallLog.start_time <= datetime.fromisoformat(end_date))
        
        # Get total count
        total_calls = query.count()
        
        # Apply pagination and get results
        calls = query.order_by(CallLog.start_time.desc()).offset(skip).limit(limit).all()
        
        # Enrich with related data
        enriched_calls = []
        for call in calls:
            call_dict = {
                "id": call.id,
                "call_sid": call.call_sid,
                "phone_number_id": call.phone_number_id,
                "assistant_id": call.assistant_id,
                "caller_number": call.caller_number,  # FROM number (our number)
                "called_number": call.called_number,   # TO number (target)
                "direction": call.direction,
                "start_time": call.start_time,
                "end_time": call.end_time,
                "duration_seconds": call.duration_seconds,
                "status": call.status,
                "credits_consumed": call.credits_consumed,
                "cost_eur": call.cost_eur,
                "created_at": call.created_at
            }
            
            # Add Assistant name
            if call.assistant_id:
                assistant = db.query(Assistant).filter(Assistant.id == call.assistant_id).first()
                call_dict["assistant_name"] = assistant.name if assistant else None
            
            # Add Phone Number
            phone_number = db.query(PhoneNumber).filter(PhoneNumber.id == call.phone_number_id).first()
            call_dict["phone_number"] = phone_number.phone_number if phone_number else None
            
            enriched_calls.append(CallLogResponse(**call_dict))
        
        # Calculate summary stats
        total_duration_seconds = sum([c.duration_seconds or 0 for c in calls])
        total_credits_consumed = sum([c.credits_consumed for c in calls])
        
        summary_stats = {
            "avg_duration": total_duration_seconds / len(calls) if calls else 0,
            "total_credits": total_credits_consumed,
            "success_rate": len([c for c in calls if c.status == 'completed']) / len(calls) * 100 if calls else 0
        }
        
        return {
            "success": True,
            "data": {
                "calls": enriched_calls,
                "pagination": {
                    "total": total_calls,
                    "skip": skip,
                    "limit": limit,
                    "has_more": skip + limit < total_calls
                },
                "filters_applied": {
                    "status": status,
                    "assistant_id": assistant_id,
                    "start_date": start_date,
                    "end_date": end_date
                },
                "total_outbound_calls": total_calls,
                "total_duration_seconds": total_duration_seconds,
                "total_credits_consumed": total_credits_consumed,
                "summary_stats": summary_stats
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get outbound call history: {e}")
        raise HTTPException(status_code=500, detail="Failed to get call history")


@app.post("/webhooks/twilio/outbound")
def handle_outbound_webhook(request: dict):
    """Webhook für Twilio Outbound Call Status Updates."""
    from outbound_service import OutboundCallService
    from database import SessionLocal
    
    db = SessionLocal()
    try:
        service = OutboundCallService(db)
        success = service.handle_twilio_webhook(request)
        
        if success:
            return {"status": "success"}
        else:
            raise HTTPException(status_code=400, detail="Failed to process webhook")
            
    except Exception as e:
        logger.error(f"Webhook processing failed: {e}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")
    finally:
        db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)