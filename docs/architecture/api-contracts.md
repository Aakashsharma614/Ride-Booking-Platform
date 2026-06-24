# API Contracts

All APIs are exposed through the API gateway.

| Method | Path | Roles | Description |
| --- | --- | --- | --- |
| POST | `/riders/register` | public | Create rider |
| POST | `/riders/login` | public | Issue rider JWT |
| GET | `/riders/me` | RIDER, ADMIN | Rider profile |
| PATCH | `/riders/me` | RIDER | Update rider profile |
| POST | `/drivers/register` | public | Create driver |
| POST | `/drivers/login` | public | Issue driver JWT |
| POST | `/drivers/me/online` | DRIVER | Emit DriverOnline |
| POST | `/drivers/me/offline` | DRIVER | Emit DriverOffline |
| POST | `/drivers/me/location` | DRIVER | Update Redis GEO and emit DriverLocationUpdated |
| GET | `/drivers/nearby` | RIDER, ADMIN | Nearby driver lookup |
| POST | `/rides` | RIDER | Start ride booking saga |
| POST | `/rides/{id}/start` | DRIVER | Start ride |
| POST | `/rides/{id}/complete` | DRIVER | Complete ride |
| POST | `/rides/{id}/cancel` | authenticated | Cancel ride |
| POST | `/pricing/quote` | public | Fare quote |
| GET | `/analytics/summary` | ADMIN | Operations metrics |

