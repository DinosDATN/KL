const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/sequelize");

const CreatorApplication = sequelize.define(
  "CreatorApplication",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    specialization: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: "Chuyên ngành chính (Web, Mobile, AI, DevOps...)",
    },
    work_experience: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: "Kinh nghiệm làm việc: [{years, position, company}]",
      validate: {
        isArray(value) {
          if (!Array.isArray(value)) {
            throw new Error("Work experience must be an array");
          }
        },
      },
    },
    skills: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "Kỹ năng nổi bật (tags: Node.js, React, Java...)",
      get() {
        const value = this.getDataValue("skills");
        return value ? value.split(",").map((s) => s.trim()) : [];
      },
      set(value) {
        if (Array.isArray(value)) {
          this.setDataValue("skills", value.join(","));
        } else {
          this.setDataValue("skills", value);
        }
      },
    },
    certificates: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Bằng cấp/chứng chỉ: [{type, url, file_url}]",
    },
    portfolio: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "Danh mục dự án: [{type, url}]",
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: "Mô tả bản thân (2-5 dòng)",
      validate: {
        len: {
          args: [50, 1000],
          msg: "Bio must be between 50 and 1000 characters",
        },
      },
    },
    teaching_experience: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Kinh nghiệm giảng dạy (nếu có)",
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
      allowNull: false,
    },
    reviewed_by: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      comment: "Admin đã duyệt/từ chối",
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Lý do từ chối (nếu có)",
    },
  },
  {
    tableName: "creator_applications",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ["user_id"],
      },
      {
        fields: ["status"],
      },
      {
        fields: ["created_at"],
      },
      {
        unique: true,
        fields: ["user_id", "status"],
        where: {
          status: "pending",
        },
      },
    ],
    hooks: {
      afterFind: (instances) => {
        // Ensure JSON fields are properly parsed
        const parseInstances = (instance) => {
          if (!instance) return;
          
          // Parse work_experience if it's a string
          if (instance.work_experience && typeof instance.work_experience === 'string') {
            try {
              instance.work_experience = JSON.parse(instance.work_experience);
            } catch (e) {
              console.warn('Failed to parse work_experience:', e);
            }
          }
          
          // Parse certificates if it's a string
          if (instance.certificates && typeof instance.certificates === 'string') {
            try {
              instance.certificates = JSON.parse(instance.certificates);
            } catch (e) {
              console.warn('Failed to parse certificates:', e);
            }
          }
          
          // Parse portfolio if it's a string
          if (instance.portfolio && typeof instance.portfolio === 'string') {
            try {
              instance.portfolio = JSON.parse(instance.portfolio);
            } catch (e) {
              console.warn('Failed to parse portfolio:', e);
            }
          }
        };
        
        if (Array.isArray(instances)) {
          instances.forEach(parseInstances);
        } else {
          parseInstances(instances);
        }
      }
    }
  }
);

module.exports = CreatorApplication;

