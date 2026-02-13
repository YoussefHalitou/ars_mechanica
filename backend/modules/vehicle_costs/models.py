"""
SQLAlchemy models for vehicle costs module
Matches public.t_vehicles and related tables exactly from DDL
"""
from sqlalchemy import Column, String, Numeric, Boolean, DateTime, Date, Text, Integer, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from datetime import datetime
from uuid import uuid4

from backend.core.database import Base


class Vehicle(Base):
    """
    Vehicle model matching public.t_vehicles table exactly
    """
    __tablename__ = 't_vehicles'
    __table_args__ = {'schema': 'public'}
    
    # Primary key (matches DDL: vehicle_id text NOT NULL)
    vehicle_id = Column(String, primary_key=True)
    
    # Vehicle information (matches DDL exactly)
    nickname = Column(String)
    unit = Column(String, default='Tag')
    status = Column(String, default='bereit')
    inhalt = Column(Text)  # Contents/inventory
    notes = Column(Text)
    is_deleted = Column(Boolean, default=False)
    
    # Timestamps (matches DDL exactly)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    rates = relationship("VehicleRate", back_populates="vehicle", uselist=False)
    daily_status = relationship("VehicleDailyStatus", back_populates="vehicle")
    inventory = relationship("VehicleInventory", back_populates="vehicle")
    
    def __repr__(self):
        return f"<Vehicle(vehicle_id='{self.vehicle_id}', nickname='{self.nickname}')>"
    
    def to_dict(self):
        result = {
            'vehicle_id': self.vehicle_id,
            'nickname': self.nickname,
            'unit': self.unit,
            'status': self.status,
            'inhalt': self.inhalt,
            'notes': self.notes,
            'is_deleted': self.is_deleted,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
        
        # Add rate information if available
        if self.rates:
            result.update({
                'cost_per_unit': float(self.rates.cost_per_unit) if self.rates.cost_per_unit else None,
                'price_per_unit': float(self.rates.price_per_unit) if self.rates.price_per_unit else None,
                'gas_cost_per_unit': float(self.rates.gas_cost_per_unit) if self.rates.gas_cost_per_unit else None,
                'gas_price_per_unit': float(self.rates.gas_price_per_unit) if self.rates.gas_price_per_unit else None,
                'total_cost_per_unit': float(self.rates.total_cost_per_unit) if self.rates.total_cost_per_unit else None,
                'total_price_per_unit': float(self.rates.total_price_per_unit) if self.rates.total_price_per_unit else None,
                'currency': self.rates.currency
            })
        
        return result


class VehicleRate(Base):
    """
    Vehicle rates from t_vehicle_rates table
    """
    __tablename__ = 't_vehicle_rates'
    __table_args__ = {'schema': 'public'}
    
    vehicle_id = Column(String, ForeignKey('public.t_vehicles.vehicle_id'), primary_key=True)
    cost_per_unit = Column(Numeric)
    gas_cost_per_unit = Column(Numeric)
    price_per_unit = Column(Numeric)
    gas_price_per_unit = Column(Numeric)
    currency = Column(String, default='EUR')
    updated_by = Column(String)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    total_cost_per_unit = Column(Numeric)  # Calculated: cost + gas_cost
    total_price_per_unit = Column(Numeric)  # Calculated: price + gas_price
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="rates")
    
    def __repr__(self):
        return f"<VehicleRate(vehicle_id='{self.vehicle_id}')>"


class VehicleDailyStatus(Base):
    """
    Vehicle daily status from t_vehicle_daily_status table
    """
    __tablename__ = 't_vehicle_daily_status'
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True)
    vehicle_name = Column(String, nullable=False)
    status = Column(String, default='')
    informationen = Column(Text, default='')
    plan_date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    vehicle_id = Column(String, ForeignKey('public.t_vehicles.vehicle_id'))
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="daily_status")
    
    def __repr__(self):
        return f"<VehicleDailyStatus(id={self.id}, vehicle_name='{self.vehicle_name}', plan_date='{self.plan_date}')>"


class VehicleInventory(Base):
    """
    Vehicle inventory from t_vehicle_inventory table
    """
    __tablename__ = 't_vehicle_inventory'
    __table_args__ = {'schema': 'public'}
    
    id = Column(Integer, primary_key=True)
    vehicle_id = Column(String, ForeignKey('public.t_vehicles.vehicle_id'))
    inventory_date = Column(Date)
    contents = Column(Text)
    reported_by = Column(String)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationships
    vehicle = relationship("Vehicle", back_populates="inventory")
    
    def __repr__(self):
        return f"<VehicleInventory(id={self.id}, vehicle_id='{self.vehicle_id}')>"


class VehicleCost(Base):
    """
    Vehicle costs for projects
    """
    __tablename__ = 't_vehicle_costs'
    __table_args__ = {'schema': 'public'}
    
    # Primary key
    id = Column(String, primary_key=True, default=lambda: str(uuid4()))
    
    # Project reference
    project_id = Column(String, ForeignKey('public.t_projects.project_id'), nullable=False)
    
    # Vehicle information
    cost_date = Column(Date, nullable=False)
    vehicle_type = Column(String, nullable=False)
    vehicle_identifier = Column(String)
    
    # Cost details
    description = Column(String, nullable=False)
    cost_type = Column(String, nullable=False)  # Kraftstoff, Wartung, Reparatur, etc.
    amount = Column(Numeric, nullable=False)
    mileage = Column(Numeric)
    receipt_number = Column(String)
    
    # Notes
    notes = Column(Text)
    
    # Timestamps
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    project = relationship("Project")
    
    def __repr__(self):
        return f"<VehicleCost(id='{self.id}', project_id='{self.project_id}', cost_type='{self.cost_type}')>"