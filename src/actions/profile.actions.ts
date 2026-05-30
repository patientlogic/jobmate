"use server";
import prisma from "@/lib/db";
import { handleError } from "@/lib/utils";
import { AddEducationFormSchema } from "@/models/AddEductionForm.schema";
import { AddContactInfoFormSchema } from "@/models/addContactInfoForm.schema";
import { AddCertificationFormSchema } from "@/models/addCertificationForm.schema";
import { AddExperienceFormSchema } from "@/models/addExperienceForm.schema";
import { AddSummarySectionFormSchema } from "@/models/addSummaryForm.schema";
import { CreateResumeFormSchema } from "@/models/createResumeForm.schema";
import { ResumeSection, SectionType, Summary } from "@/models/profile.model";
import { requireSubjectUserId } from "@/lib/admin-scope";
import { APP_CONSTANTS } from "@/lib/constants";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import path from "path";
import fs from "fs";
import { writeFile } from "fs/promises";

export const getResumeList = async (
  page: number = 1,
  limit: number = APP_CONSTANTS.RECORDS_PER_PAGE,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.resume.findMany({
        where: {
          profile: {
            userId: ownerId,
          },
        },
        skip,
        take: limit,
        select: {
          id: true,
          profileId: true,
          FileId: true,
          createdAt: true,
          updatedAt: true,
          title: true,
          _count: {
            select: {
              Job: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.resume.count({
        where: {
          profile: {
            userId: ownerId,
          },
        },
      }),
    ]);
    return { data, total, success: true };
  } catch (error) {
    const msg = "Failed to get resume list.";
    return handleError(error, msg);
  }
};

export const getResumeById = async (
  resumeId: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    if (!resumeId) {
      throw new Error("Please provide resume id");
    }
    const ownerId = await requireSubjectUserId(subjectUserId);

    const resume = await prisma.resume.findUnique({
      where: {
        id: resumeId,
        profile: { userId: ownerId },
      },
      include: {
        ContactInfo: true,
        File: true,
        ResumeSections: {
          include: {
            summary: true,
            workExperiences: {
              include: {
                jobTitle: true,
                Company: true,
                location: true,
              },
            },
            educations: {
              include: {
                location: true,
              },
            },
            licenseOrCertifications: true,
          },
        },
      },
    });
    return { data: resume, success: true };
  } catch (error) {
    const msg = "Failed to get resume.";
    return handleError(error, msg);
  }
};

export const addContactInfo = async (
  data: z.infer<typeof AddContactInfoFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    const res = await prisma.resume.update({
      where: {
        id: data.resumeId,
        profile: { userId: ownerId },
      },
      data: {
        ContactInfo: {
          connectOrCreate: {
            where: { resumeId: data.resumeId },
            create: {
              firstName: data.firstName,
              lastName: data.lastName,
              headline: data.headline,
              email: data.email!,
              phone: data.phone!,
              address: data.address,
            },
          },
        },
      },
    });
    revalidatePath("/dashboard/profile/resume");
    return { data: res, success: true };
  } catch (error) {
    const msg = "Failed to create contact info.";
    return handleError(error, msg);
  }
};

export const updateContactInfo = async (
  data: z.infer<typeof AddContactInfoFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    const res = await prisma.contactInfo.update({
      where: {
        id: data.id,
        resume: { profile: { userId: ownerId } },
      },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        headline: data.headline,
        email: data.email!,
        phone: data.phone!,
        address: data.address,
      },
    });
    revalidatePath("/dashboard/profile/resume");
    return { data: res, success: true };
  } catch (error) {
    const msg = "Failed to update contact info.";
    return handleError(error, msg);
  }
};

export const createResumeProfile = async (
  title: string,
  fileName: string,
  filePath?: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    //check if title exists
    const value = title.trim().toLowerCase();

    const titleExists = await prisma.resume.findFirst({
      where: {
        title: value,
        profile: {
          userId: ownerId,
        },
      },
    });

    if (titleExists) {
      throw new Error("Title already exists!");
    }

    const profile = await prisma.profile.findFirst({
      where: {
        userId: ownerId,
      },
    });

    const res =
      profile && profile.id
        ? await prisma.resume.create({
            data: {
              profileId: profile!.id,
              title,
              FileId: fileName
                ? await createFileEntry(fileName, filePath)
                : null,
            },
          })
        : await prisma.profile.create({
            data: {
              userId: ownerId,
              resumes: {
                create: [
                  {
                    title,
                    FileId: fileName
                      ? await createFileEntry(fileName, filePath)
                      : null,
                  },
                ],
              },
            },
          });
    // revalidatePath("/dashboard/jobs", "page");
    return { success: true, data: res };
  } catch (error) {
    const msg = "Failed to create resume.";
    return handleError(error, msg);
  }
};

const createFileEntry = async (
  fileName: string | undefined,
  filePath: string | undefined,
) => {
  const newFileEntry = await prisma.file.create({
    data: {
      fileName: fileName!,
      filePath: filePath!,
      fileType: "resume",
    },
  });
  return newFileEntry.id;
};

export const editResume = async (
  id: string,
  title: string,
  fileId?: string,
  fileName?: string,
  filePath?: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    let resolvedFileId = fileId;

    if (!fileId && fileName && filePath) {
      resolvedFileId = await createFileEntry(fileName, filePath);
    }

    if (resolvedFileId) {
      const isValidFileId = await prisma.file.findFirst({
        where: { id: resolvedFileId },
      });

      if (!isValidFileId) {
        throw new Error(
          `The provided FileId "${resolvedFileId}" does not exist.`,
        );
      }
    }

    const ownerId = await requireSubjectUserId(subjectUserId);

    const res = await prisma.resume.update({
      where: { id, profile: { userId: ownerId } },
      data: {
        title,
        FileId: resolvedFileId || null,
      },
    });
    return { success: true, data: res };
  } catch (error) {
    const msg = "Failed to update resume or file.";
    return handleError(error, msg);
  }
};

export const deleteResumeById = async (
  resumeId: string,
  fileId?: string,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);
    if (fileId) {
      await deleteFile(fileId);
    }

    await prisma.$transaction(async (prisma) => {
      const resume = await prisma.resume.findFirst({
        where: { id: resumeId, profile: { userId: ownerId } },
        select: { id: true },
      });
      if (!resume) {
        throw new Error("Resume not found");
      }

      await prisma.contactInfo.deleteMany({
        where: {
          resumeId: resumeId,
        },
      });

      await prisma.summary.deleteMany({
        where: {
          ResumeSection: {
            resumeId: resumeId,
          },
        },
      });

      await prisma.workExperience.deleteMany({
        where: {
          ResumeSection: {
            resumeId: resumeId,
          },
        },
      });

      await prisma.education.deleteMany({
        where: {
          ResumeSection: {
            resumeId: resumeId,
          },
        },
      });

      await prisma.licenseOrCertification.deleteMany({
        where: {
          ResumeSection: {
            resumeId: resumeId,
          },
        },
      });

      await prisma.resumeSection.deleteMany({
        where: {
          resumeId: resumeId,
        },
      });

      await prisma.resume.delete({
        where: { id: resumeId },
      });
    });
    return { success: true };
  } catch (error) {
    const msg = "Failed to delete resume.";
    return handleError(error, msg);
  }
};

export const uploadFile = async (file: File, dir: string, path: string) => {
  const bytes = await file.arrayBuffer();
  const buffer = new Uint8Array(bytes);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await writeFile(path, buffer);
};

export const deleteFile = async (fileId: string) => {
  try {
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
      },
    });

    const filePath = file?.filePath as string;

    const fullFilePath = path.join(filePath);
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }
    fs.unlinkSync(filePath);

    await prisma.file.delete({
      where: {
        id: fileId,
      },
    });

    console.log("file deleted successfully!");
  } catch (error) {
    const msg = "Failed to delete file.";
    return handleError(error, msg);
  }
};

export const addResumeSummary = async (
  data: z.infer<typeof AddSummarySectionFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);
    const resume = await prisma.resume.findFirst({
      where: { id: data.resumeId!, profile: { userId: ownerId } },
      select: { id: true },
    });
    if (!resume) {
      throw new Error("Resume not found");
    }

    const res = await prisma.resumeSection.create({
      data: {
        resumeId: data.resumeId!,
        sectionTitle: data.sectionTitle!,
        sectionType: SectionType.SUMMARY,
      },
    });

    const summary = await prisma.resumeSection.update({
      where: {
        id: res.id,
      },
      data: {
        summary: {
          create: {
            content: data.content!,
          },
        },
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: summary, success: true };
  } catch (error) {
    const msg = "Failed to create summary.";
    return handleError(error, msg);
  }
};

export const updateResumeSummary = async (
  data: z.infer<typeof AddSummarySectionFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    const res = await prisma.resumeSection.update({
      where: {
        id: data.id,
        Resume: { profile: { userId: ownerId } },
      },
      data: {
        sectionTitle: data.sectionTitle!,
      },
    });

    const summary = await prisma.resumeSection.update({
      where: {
        id: data.id,
        Resume: { profile: { userId: ownerId } },
      },
      data: {
        summary: {
          update: {
            content: data.content!,
          },
        },
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: summary, success: true };
  } catch (error) {
    const msg = "Failed to update summary.";
    return handleError(error, msg);
  }
};

export const addExperience = async (
  data: z.infer<typeof AddExperienceFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    if (!data.sectionId && !data.sectionTitle) {
      throw new Error("SectionTitle is required.");
    }

    const resume = await prisma.resume.findFirst({
      where: { id: data.resumeId!, profile: { userId: ownerId } },
      select: { id: true },
    });
    if (!resume) {
      throw new Error("Resume not found");
    }

    const section = !data.sectionId
      ? await prisma.resumeSection.create({
          data: {
            resumeId: data.resumeId!,
            sectionTitle: data.sectionTitle!,
            sectionType: SectionType.EXPERIENCE,
          },
        })
      : undefined;

    const experience = await prisma.resumeSection.update({
      where: {
        id: section ? section.id : data.sectionId,
      },
      data: {
        workExperiences: {
          create: {
            jobTitleId: data.title,
            companyId: data.company,
            locationId: data.location,
            startDate: data.startDate,
            endDate: data.endDate,
            description: data.jobDescription,
          },
        },
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: experience, success: true };
  } catch (error) {
    const msg = "Failed to create experience.";
    return handleError(error, msg);
  }
};

export const updateExperience = async (
  data: z.infer<typeof AddExperienceFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    const summary = await prisma.workExperience.update({
      where: {
        id: data.id,
        ResumeSection: { Resume: { profile: { userId: ownerId } } },
      },
      data: {
        jobTitleId: data.title,
        companyId: data.company,
        locationId: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.jobDescription,
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: summary, success: true };
  } catch (error) {
    const msg = "Failed to update experience.";
    return handleError(error, msg);
  }
};

export const addEducation = async (
  data: z.infer<typeof AddEducationFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    const resume = await prisma.resume.findFirst({
      where: { id: data.resumeId!, profile: { userId: ownerId } },
      select: { id: true },
    });
    if (!resume) {
      throw new Error("Resume not found");
    }

    const section = !data.sectionId
      ? await prisma.resumeSection.create({
          data: {
            resumeId: data.resumeId!,
            sectionTitle: data.sectionTitle!,
            sectionType: SectionType.EDUCATION,
          },
        })
      : undefined;

    const education = await prisma.resumeSection.update({
      where: {
        id: section ? section.id : data.sectionId,
      },
      data: {
        educations: {
          create: {
            institution: data.institution,
            degree: data.degree,
            fieldOfStudy: data.fieldOfStudy,
            locationId: data.location,
            startDate: data.startDate,
            endDate: data.endDate,
            description: data.description,
          },
        },
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: education, success: true };
  } catch (error) {
    const msg = "Failed to create education.";
    return handleError(error, msg);
  }
};

export const updateEducation = async (
  data: z.infer<typeof AddEducationFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    const summary = await prisma.education.update({
      where: {
        id: data.id,
        ResumeSection: { Resume: { profile: { userId: ownerId } } },
      },
      data: {
        institution: data.institution,
        degree: data.degree,
        fieldOfStudy: data.fieldOfStudy,
        locationId: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        description: data.description,
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: summary, success: true };
  } catch (error) {
    const msg = "Failed to update education.";
    return handleError(error, msg);
  }
};

export const addCertification = async (
  data: z.infer<typeof AddCertificationFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    const resume = await prisma.resume.findFirst({
      where: { id: data.resumeId!, profile: { userId: ownerId } },
      select: { id: true },
    });
    if (!resume) {
      throw new Error("Resume not found");
    }

    const section = !data.sectionId
      ? await prisma.resumeSection.create({
          data: {
            resumeId: data.resumeId!,
            sectionTitle: data.sectionTitle!,
            sectionType: SectionType.CERTIFICATION,
          },
        })
      : undefined;

    const result = await prisma.resumeSection.update({
      where: {
        id: section ? section.id : data.sectionId,
      },
      data: {
        licenseOrCertifications: {
          create: {
            title: data.title,
            organization: data.organization,
            issueDate: data.issueDate,
            expirationDate: data.expirationDate,
            credentialUrl: data.credentialUrl,
          },
        },
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: result, success: true };
  } catch (error) {
    const msg = "Failed to create certification.";
    return handleError(error, msg);
  }
};

export const updateCertification = async (
  data: z.infer<typeof AddCertificationFormSchema>,
  subjectUserId?: string,
): Promise<any | undefined> => {
  try {
    const ownerId = await requireSubjectUserId(subjectUserId);

    const result = await prisma.licenseOrCertification.update({
      where: {
        id: data.id,
        ResumeSection: { Resume: { profile: { userId: ownerId } } },
      },
      data: {
        title: data.title,
        organization: data.organization,
        issueDate: data.issueDate,
        expirationDate: data.expirationDate,
        credentialUrl: data.credentialUrl,
      },
    });
    revalidatePath(`/dashboard/profile/resume/${data.resumeId}`);
    return { data: result, success: true };
  } catch (error) {
    const msg = "Failed to update certification.";
    return handleError(error, msg);
  }
};
