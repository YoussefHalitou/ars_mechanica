"""
Statistics Service for LIS SaaS Platform
Provides analytical functions for business data
"""
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, cast, Float
from decimal import Decimal
import uuid

# Note: For production, install these with: pip install pandas numpy scikit-learn
try:
    import pandas as pd
    import numpy as np
    from scipy import stats
    ANALYTICS_AVAILABLE = True
except ImportError:
    ANALYTICS_AVAILABLE = False
    pd = None
    np = None
    stats = None


class DescriptiveStatistics:
    """
    Descriptive statistics for all tiers.
    Basic summaries and aggregations.
    """
    
    @staticmethod
    async def get_project_summary(
        db: AsyncSession,
        tenant_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Get project statistics summary"""
        from backend.modules.projects.models import Project
        
        query = select(Project).where(
            Project.tenant_id == uuid.UUID(tenant_id)
        )
        
        if start_date:
            query = query.where(Project.project_date >= start_date)
        if end_date:
            query = query.where(Project.project_date <= end_date)
        
        result = await db.execute(query)
        projects = result.scalars().all()
        
        # Count by status
        status_counts = {}
        for p in projects:
            status = p.status or "Unknown"
            status_counts[status] = status_counts.get(status, 0) + 1
        
        return {
            "total_projects": len(projects),
            "by_status": status_counts,
            "period": {
                "start": start_date.isoformat() if start_date else None,
                "end": end_date.isoformat() if end_date else None
            }
        }
    
    @staticmethod
    async def get_employee_hours(
        db: AsyncSession,
        tenant_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Get employee work hours statistics"""
        from backend.modules.time_pairs.models import TimePair
        
        query = select(TimePair).where(
            TimePair.tenant_id == uuid.UUID(tenant_id)
        )
        
        if start_date:
            query = query.where(TimePair.datum >= start_date)
        if end_date:
            query = query.where(TimePair.datum <= end_date)
        
        result = await db.execute(query)
        time_pairs = result.scalars().all()
        
        # Aggregate by employee
        employee_hours = {}
        for tp in time_pairs:
            emp = tp.mitarbeiter or tp.employee_name or "Unknown"
            hours = float(tp.ges_lis_h or 0)
            employee_hours[emp] = employee_hours.get(emp, 0) + hours
        
        total_hours = sum(employee_hours.values())
        
        return {
            "total_hours": round(total_hours, 2),
            "by_employee": {k: round(v, 2) for k, v in employee_hours.items()},
            "average_per_employee": round(total_hours / len(employee_hours), 2) if employee_hours else 0,
            "record_count": len(time_pairs)
        }
    
    @staticmethod
    async def get_revenue_summary(
        db: AsyncSession,
        tenant_id: str,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None
    ) -> Dict[str, Any]:
        """Get revenue statistics"""
        # Placeholder - would connect to actual revenue data
        return {
            "total_revenue": 0,
            "average_project_value": 0,
            "by_month": {},
            "note": "Connect to actual revenue data"
        }


class InferentialStatistics:
    """
    Inferential statistics for Enterprise tier.
    Predictions, trends, and advanced analytics.
    """
    
    @staticmethod
    def _check_analytics() -> None:
        """Check if analytics libraries are available"""
        if not ANALYTICS_AVAILABLE:
            raise ImportError(
                "Analytics libraries (pandas, numpy, scipy) are required. "
                "Install with: pip install pandas numpy scipy scikit-learn"
            )
    
    @staticmethod
    async def forecast_revenue(
        db: AsyncSession,
        tenant_id: str,
        months_ahead: int = 3
    ) -> Dict[str, Any]:
        """
        Forecast future revenue based on historical data.
        Uses simple linear regression.
        """
        InferentialStatistics._check_analytics()
        
        # Get historical data (placeholder)
        # In production, this would query actual revenue data
        historical_data = [
            {"month": "2024-01", "revenue": 45000},
            {"month": "2024-02", "revenue": 48000},
            {"month": "2024-03", "revenue": 52000},
            {"month": "2024-04", "revenue": 49000},
            {"month": "2024-05", "revenue": 55000},
            {"month": "2024-06", "revenue": 58000},
        ]
        
        if len(historical_data) < 3:
            return {"error": "Not enough historical data for forecasting"}
        
        # Prepare data
        df = pd.DataFrame(historical_data)
        df['month_num'] = range(len(df))
        
        # Simple linear regression
        X = df['month_num'].values.reshape(-1, 1)
        y = df['revenue'].values
        
        slope, intercept, r_value, p_value, std_err = stats.linregress(
            df['month_num'], df['revenue']
        )
        
        # Generate forecast
        forecast = []
        last_month = len(historical_data)
        
        for i in range(months_ahead):
            month_num = last_month + i
            predicted_revenue = slope * month_num + intercept
            
            # Add confidence interval (simplified)
            confidence = std_err * 1.96
            
            forecast.append({
                "month_offset": i + 1,
                "predicted_revenue": round(predicted_revenue, 2),
                "confidence_low": round(predicted_revenue - confidence, 2),
                "confidence_high": round(predicted_revenue + confidence, 2)
            })
        
        return {
            "historical_months": len(historical_data),
            "trend": "increasing" if slope > 0 else "decreasing",
            "trend_strength": round(abs(r_value), 3),
            "monthly_growth": round(slope, 2),
            "forecast": forecast,
            "model": {
                "type": "linear_regression",
                "r_squared": round(r_value ** 2, 3),
                "p_value": round(p_value, 4)
            }
        }
    
    @staticmethod
    async def analyze_productivity(
        db: AsyncSession,
        tenant_id: str
    ) -> Dict[str, Any]:
        """
        Analyze employee productivity trends.
        """
        InferentialStatistics._check_analytics()
        
        from backend.modules.time_pairs.models import TimePair
        
        # Get time data
        query = select(TimePair).where(
            TimePair.tenant_id == uuid.UUID(tenant_id)
        )
        result = await db.execute(query)
        time_pairs = result.scalars().all()
        
        if not time_pairs:
            return {"error": "No time tracking data available"}
        
        # Aggregate by employee
        employee_data = {}
        for tp in time_pairs:
            emp = tp.mitarbeiter or tp.employee_name or "Unknown"
            if emp not in employee_data:
                employee_data[emp] = {"hours": [], "dates": []}
            
            employee_data[emp]["hours"].append(float(tp.ges_lis_h or 0))
            employee_data[emp]["dates"].append(tp.datum)
        
        # Calculate productivity metrics
        productivity = []
        for emp, data in employee_data.items():
            hours = data["hours"]
            
            productivity.append({
                "employee": emp,
                "total_hours": round(sum(hours), 2),
                "average_daily": round(np.mean(hours), 2) if hours else 0,
                "std_deviation": round(np.std(hours), 2) if len(hours) > 1 else 0,
                "consistency_score": round(1 - (np.std(hours) / np.mean(hours)), 2) if hours and np.mean(hours) > 0 else 0,
                "days_worked": len(hours)
            })
        
        # Sort by total hours
        productivity.sort(key=lambda x: x["total_hours"], reverse=True)
        
        return {
            "employee_count": len(productivity),
            "total_tracked_hours": round(sum(p["total_hours"] for p in productivity), 2),
            "employees": productivity,
            "insights": {
                "top_performer": productivity[0]["employee"] if productivity else None,
                "most_consistent": max(productivity, key=lambda x: x["consistency_score"])["employee"] if productivity else None
            }
        }
    
    @staticmethod
    async def detect_anomalies(
        db: AsyncSession,
        tenant_id: str,
        metric: str = "hours"
    ) -> Dict[str, Any]:
        """
        Detect anomalies in business metrics using statistical methods.
        """
        InferentialStatistics._check_analytics()
        
        from backend.modules.time_pairs.models import TimePair
        
        query = select(TimePair).where(
            TimePair.tenant_id == uuid.UUID(tenant_id)
        )
        result = await db.execute(query)
        time_pairs = result.scalars().all()
        
        if len(time_pairs) < 10:
            return {"error": "Not enough data for anomaly detection (need at least 10 records)"}
        
        # Extract metric values
        values = [float(tp.ges_lis_h or 0) for tp in time_pairs]
        
        # Calculate statistics
        mean = np.mean(values)
        std = np.std(values)
        
        # Detect anomalies (values more than 2 std from mean)
        anomalies = []
        for i, tp in enumerate(time_pairs):
            value = float(tp.ges_lis_h or 0)
            z_score = (value - mean) / std if std > 0 else 0
            
            if abs(z_score) > 2:
                anomalies.append({
                    "date": tp.datum.isoformat() if tp.datum else None,
                    "employee": tp.mitarbeiter or tp.employee_name,
                    "value": value,
                    "z_score": round(z_score, 2),
                    "type": "high" if z_score > 0 else "low"
                })
        
        return {
            "metric": metric,
            "statistics": {
                "mean": round(mean, 2),
                "std_deviation": round(std, 2),
                "min": round(min(values), 2),
                "max": round(max(values), 2)
            },
            "anomaly_count": len(anomalies),
            "anomalies": anomalies[:20],  # Limit to 20
            "threshold": "2 standard deviations"
        }
    
    @staticmethod
    async def project_profitability_analysis(
        db: AsyncSession,
        tenant_id: str
    ) -> Dict[str, Any]:
        """
        Analyze project profitability trends.
        """
        # Placeholder - would analyze actual project costs vs revenue
        return {
            "average_margin_percent": 35,
            "profitable_projects_percent": 85,
            "top_profitable_categories": ["Umzug Premium", "Montage"],
            "recommendations": [
                "Focus on premium services",
                "Optimize material costs",
                "Review low-margin projects"
            ],
            "note": "Connect to actual project financial data"
        }


class StatisticsService:
    """
    Main statistics service combining all analytics capabilities.
    """
    
    descriptive = DescriptiveStatistics()
    inferential = InferentialStatistics()
    
    @classmethod
    async def get_dashboard_stats(
        cls,
        db: AsyncSession,
        tenant_id: str,
        tier: str
    ) -> Dict[str, Any]:
        """
        Get statistics appropriate for user's subscription tier.
        """
        result = {
            "tier": tier,
            "generated_at": datetime.utcnow().isoformat()
        }
        
        # Descriptive stats for all tiers
        result["projects"] = await cls.descriptive.get_project_summary(
            db, tenant_id,
            start_date=date.today() - timedelta(days=30)
        )
        result["hours"] = await cls.descriptive.get_employee_hours(
            db, tenant_id,
            start_date=date.today() - timedelta(days=30)
        )
        
        # Inferential stats for Enterprise only
        if tier == "enterprise":
            try:
                result["forecast"] = await cls.inferential.forecast_revenue(
                    db, tenant_id
                )
                result["productivity"] = await cls.inferential.analyze_productivity(
                    db, tenant_id
                )
                result["anomalies"] = await cls.inferential.detect_anomalies(
                    db, tenant_id
                )
            except ImportError as e:
                result["enterprise_features_error"] = str(e)
        
        return result
